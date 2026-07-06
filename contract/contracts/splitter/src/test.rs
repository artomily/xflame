#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, token, vec, Address, Env};

struct Fixture<'a> {
    env: Env,
    client: SplitVaultClient<'a>,
    token_admin: token::StellarAssetClient<'a>,
    token: token::Client<'a>,
    user: Address,
}

fn setup(mint: i128) -> Fixture<'static> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin = token::StellarAssetClient::new(&env, &sac.address());
    let token = token::Client::new(&env, &sac.address());

    let contract_id = env.register(SplitVault, (sac.address(),));
    let client = SplitVaultClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    token_admin.mint(&user, &mint);

    Fixture { env, client, token_admin, token, user }
}

fn fixed_rule(env: &Env) -> SplitRule {
    SplitRule::Fixed(vec![
        env,
        Allocation { pocket: symbol_short!("stability"), bps: 5000 },
        Allocation { pocket: symbol_short!("dca"), bps: 3000 },
        Allocation { pocket: symbol_short!("cash"), bps: 2000 },
    ])
}

#[test]
fn fixed_split_divides_by_bps() {
    let f = setup(1_000);
    f.client.set_rule(&f.user, &fixed_rule(&f.env));
    f.client.deposit(&f.user, &1_000);

    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("stability")), 500);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("dca")), 300);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("cash")), 200);
    // Funds actually moved into the vault.
    assert_eq!(f.token.balance(&f.user), 0);
}

#[test]
fn fixed_split_preserves_total_with_rounding() {
    let f = setup(1_000);
    // 1/3 each in bps (3333 + 3333 + 3334 = 10000); deposit 100 stroops.
    let rule = SplitRule::Fixed(vec![
        &f.env,
        Allocation { pocket: symbol_short!("a"), bps: 3333 },
        Allocation { pocket: symbol_short!("b"), bps: 3333 },
        Allocation { pocket: symbol_short!("c"), bps: 3334 },
    ]);
    f.client.set_rule(&f.user, &rule);
    f.client.deposit(&f.user, &100);

    let a = f.client.pocket_balance(&f.user, &symbol_short!("a"));
    let b = f.client.pocket_balance(&f.user, &symbol_short!("b"));
    let c = f.client.pocket_balance(&f.user, &symbol_short!("c"));
    assert_eq!(a, 33);
    assert_eq!(b, 33);
    // Last pocket soaks the remainder: 100 - 33 - 33 = 34.
    assert_eq!(c, 34);
    assert_eq!(a + b + c, 100);
}

#[test]
fn goal_split_fills_in_priority_order() {
    let f = setup(2_000);
    let rule = SplitRule::Goal(
        vec![
            &f.env,
            Goal { pocket: symbol_short!("emergency"), target: 600 },
            Goal { pocket: symbol_short!("motor"), target: 300 },
        ],
        symbol_short!("cash"),
    );
    f.client.set_rule(&f.user, &rule);

    // First 500 all goes to the first goal (not yet full).
    f.client.deposit(&f.user, &500);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("emergency")), 500);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("motor")), 0);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("cash")), 0);

    // Next 500: 100 tops up emergency (→600), 300 fills motor, 100 overflow to cash.
    f.client.deposit(&f.user, &500);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("emergency")), 600);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("motor")), 300);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("cash")), 100);
}

#[test]
fn goal_split_all_met_goes_to_overflow() {
    let f = setup(2_000);
    let rule = SplitRule::Goal(
        vec![&f.env, Goal { pocket: symbol_short!("emergency"), target: 100 }],
        symbol_short!("cash"),
    );
    f.client.set_rule(&f.user, &rule);
    f.client.deposit(&f.user, &100); // fills emergency
    f.client.deposit(&f.user, &250); // all overflow

    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("emergency")), 100);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("cash")), 250);
}

#[test]
fn withdraw_returns_tokens_and_debits_pocket() {
    let f = setup(1_000);
    f.client.set_rule(&f.user, &fixed_rule(&f.env));
    f.client.deposit(&f.user, &1_000);

    f.client.withdraw(&f.user, &symbol_short!("cash"), &150);
    assert_eq!(f.client.pocket_balance(&f.user, &symbol_short!("cash")), 50);
    assert_eq!(f.token.balance(&f.user), 150);
}

#[test]
fn pockets_returns_full_map() {
    let f = setup(1_000);
    f.client.set_rule(&f.user, &fixed_rule(&f.env));
    f.client.deposit(&f.user, &1_000);

    let map = f.client.pockets(&f.user);
    assert_eq!(map.len(), 3);
    assert_eq!(map.get(symbol_short!("stability")), Some(500));
}

#[test]
fn token_is_the_constructor_arg() {
    let f = setup(1);
    assert_eq!(f.client.token(), f.token.address);
    // silence unused-field warning on token_admin in this test
    let _ = &f.token_admin;
}

#[test]
#[should_panic(expected = "no split rule set")]
fn deposit_without_rule_panics() {
    let f = setup(1_000);
    f.client.deposit(&f.user, &100);
}

#[test]
#[should_panic(expected = "insufficient pocket balance")]
fn overdraw_pocket_panics() {
    let f = setup(1_000);
    f.client.set_rule(&f.user, &fixed_rule(&f.env));
    f.client.deposit(&f.user, &1_000);
    f.client.withdraw(&f.user, &symbol_short!("cash"), &999);
}

#[test]
#[should_panic(expected = "allocations must sum to 10000 bps")]
fn fixed_rule_must_sum_to_full() {
    let f = setup(1);
    let bad = SplitRule::Fixed(vec![
        &f.env,
        Allocation { pocket: symbol_short!("a"), bps: 4000 },
        Allocation { pocket: symbol_short!("b"), bps: 4000 },
    ]);
    f.client.set_rule(&f.user, &bad);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn zero_deposit_panics() {
    let f = setup(1_000);
    f.client.set_rule(&f.user, &fixed_rule(&f.env));
    f.client.deposit(&f.user, &0);
}
