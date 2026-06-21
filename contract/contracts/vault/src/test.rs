#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token, Address, Env,
};

fn create_token<'a>(env: &Env, admin: &Address) -> token::StellarAssetClient<'a> {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    token::StellarAssetClient::new(env, &sac.address())
}

#[test]
fn test_deposit_and_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let vault_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &vault_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let token_sac = create_token(&env, &admin);
    let token_id = token_sac.address.clone();

    // Mint 1000 to user
    token_sac.mint(&user, &1000);

    // Deposit 400
    client.deposit(&user, &token_id, &400);
    assert_eq!(client.balance(&user), 400);

    // Withdraw 150
    client.withdraw(&user, &token_id, &150);
    assert_eq!(client.balance(&user), 250);

    // Token balance back at user
    let tok = token::Client::new(&env, &token_id);
    assert_eq!(tok.balance(&user), 750); // 1000 - 400 + 150
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn test_overdraw_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let vault_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &vault_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let token_sac = create_token(&env, &admin);
    let token_id = token_sac.address.clone();

    token_sac.mint(&user, &100);
    client.deposit(&user, &token_id, &100);
    client.withdraw(&user, &token_id, &200); // should panic
}
