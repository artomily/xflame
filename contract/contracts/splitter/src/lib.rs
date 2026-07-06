#![no_std]
//! Auto-split vault — Phase 1 split engine for xflame.
//!
//! The moment a user deposits their stablecoin, it is split into named "pockets"
//! according to a per-user rule:
//!   - `Fixed`: static percentages (basis points) across pockets, e.g. 50% stability
//!     vault / 30% DCA basket / 20% cash.
//!   - `Goal`: priority-ordered savings goals (dana darurat, DP motor, …); each deposit
//!     tops up goals in order until their target is met, and anything left lands in a
//!     designated overflow pocket.
//!
//! For the MVP every pocket holds the same stablecoin — the pockets are accounting
//! buckets. Later phases swap the DCA pocket via Soroswap and route the stability
//! pocket into a DeFindex vault behind the same deposit/withdraw surface.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map, Symbol, Vec,
};

/// Ledgers per day at ~5s close time — used for storage TTL bumps.
const LEDGERS_PER_DAY: u32 = 17_280;
const TTL_BUMP: u32 = 30 * LEDGERS_PER_DAY;
const TTL_THRESHOLD: u32 = 15 * LEDGERS_PER_DAY;

/// One slice of a `Fixed` rule. `bps` is basis points (1/100 of a percent).
#[contracttype]
#[derive(Clone)]
pub struct Allocation {
    pub pocket: Symbol,
    pub bps: u32,
}

/// One entry of a `Goal` rule. Deposits fill `pocket` up to `target`, then move on.
#[contracttype]
#[derive(Clone)]
pub struct Goal {
    pub pocket: Symbol,
    pub target: i128,
}

/// How a user's incoming deposit is divided across pockets.
#[contracttype]
#[derive(Clone)]
pub enum SplitRule {
    /// Static percentages. All `bps` must sum to 10_000.
    Fixed(Vec<Allocation>),
    /// Priority-ordered goals plus an overflow pocket for anything left over.
    Goal(Vec<Goal>, Symbol),
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    /// The single stablecoin this vault accepts (set at construction).
    Token,
    /// A user's configured split rule.
    Rule(Address),
    /// A user's per-pocket balances: Map<pocket, stroops>.
    Pockets(Address),
}

#[contract]
pub struct SplitVault;

#[contractimpl]
impl SplitVault {
    /// Bind the vault to the single stablecoin it accepts.
    pub fn __constructor(env: Env, token: Address) {
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// The stablecoin this vault deposits/withdraws.
    pub fn token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    /// Set (or replace) the caller's split rule.
    pub fn set_rule(env: Env, user: Address, rule: SplitRule) {
        user.require_auth();
        validate_rule(&rule);
        let key = DataKey::Rule(user);
        env.storage().persistent().set(&key, &rule);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
    }

    /// The caller's split rule, if configured.
    pub fn rule(env: Env, user: Address) -> Option<SplitRule> {
        env.storage().persistent().get(&DataKey::Rule(user))
    }

    /// Deposit `amount` stroops of the vault token and split it across pockets.
    /// The caller must have a split rule configured first.
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let rule: SplitRule = env
            .storage()
            .persistent()
            .get(&DataKey::Rule(user.clone()))
            .unwrap_or_else(|| panic!("no split rule set"));

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token).transfer(
            &user,
            &env.current_contract_address(),
            &amount,
        );

        let mut pockets = load_pockets(&env, &user);
        apply_split(&rule, &mut pockets, amount);
        save_pockets(&env, &user, &pockets);

        #[allow(deprecated)]
        env.events()
            .publish((symbol_short!("deposit"), user), amount);
    }

    /// Withdraw `amount` stroops from a specific pocket back to the caller.
    pub fn withdraw(env: Env, user: Address, pocket: Symbol, amount: i128) {
        user.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let mut pockets = load_pockets(&env, &user);
        let bal = pockets.get(pocket.clone()).unwrap_or(0);
        if bal < amount {
            panic!("insufficient pocket balance");
        }
        pockets.set(pocket.clone(), bal - amount);
        save_pockets(&env, &user, &pockets);

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &user,
            &amount,
        );

        #[allow(deprecated)]
        env.events()
            .publish((symbol_short!("withdraw"), user, pocket), amount);
    }

    /// All of a user's pocket balances.
    pub fn pockets(env: Env, user: Address) -> Map<Symbol, i128> {
        load_pockets(&env, &user)
    }

    /// Balance of a single pocket.
    pub fn pocket_balance(env: Env, user: Address, pocket: Symbol) -> i128 {
        load_pockets(&env, &user).get(pocket).unwrap_or(0)
    }
}

fn load_pockets(env: &Env, user: &Address) -> Map<Symbol, i128> {
    env.storage()
        .persistent()
        .get(&DataKey::Pockets(user.clone()))
        .unwrap_or_else(|| Map::new(env))
}

fn save_pockets(env: &Env, user: &Address, pockets: &Map<Symbol, i128>) {
    let key = DataKey::Pockets(user.clone());
    env.storage().persistent().set(&key, pockets);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
}

fn credit(pockets: &mut Map<Symbol, i128>, pocket: &Symbol, amt: i128) {
    let cur = pockets.get(pocket.clone()).unwrap_or(0);
    pockets.set(pocket.clone(), cur + amt);
}

fn validate_rule(rule: &SplitRule) {
    match rule {
        SplitRule::Fixed(allocs) => {
            if allocs.is_empty() {
                panic!("rule has no allocations");
            }
            let mut sum: u32 = 0;
            for a in allocs.iter() {
                if a.bps == 0 {
                    panic!("allocation bps must be positive");
                }
                sum += a.bps;
            }
            if sum != 10_000 {
                panic!("allocations must sum to 10000 bps");
            }
        }
        SplitRule::Goal(goals, _overflow) => {
            if goals.is_empty() {
                panic!("rule has no goals");
            }
            for g in goals.iter() {
                if g.target <= 0 {
                    panic!("goal target must be positive");
                }
            }
        }
    }
}

/// Distribute `amount` across `pockets` following `rule`. Balances are preserved:
/// the sum of credited amounts always equals `amount`.
fn apply_split(rule: &SplitRule, pockets: &mut Map<Symbol, i128>, amount: i128) {
    match rule {
        SplitRule::Fixed(allocs) => {
            let n = allocs.len();
            let mut distributed: i128 = 0;
            for i in 0..n {
                let a = allocs.get(i).unwrap();
                // Last pocket soaks up any rounding remainder so nothing is lost.
                let part = if i == n - 1 {
                    amount - distributed
                } else {
                    amount * (a.bps as i128) / 10_000
                };
                credit(pockets, &a.pocket, part);
                distributed += part;
            }
        }
        SplitRule::Goal(goals, overflow) => {
            let mut remaining = amount;
            let n = goals.len();
            for i in 0..n {
                if remaining == 0 {
                    break;
                }
                let g = goals.get(i).unwrap();
                let cur = pockets.get(g.pocket.clone()).unwrap_or(0);
                let need = g.target - cur;
                if need <= 0 {
                    continue;
                }
                let put = if remaining < need { remaining } else { need };
                credit(pockets, &g.pocket, put);
                remaining -= put;
            }
            if remaining > 0 {
                credit(pockets, overflow, remaining);
            }
        }
    }
}

mod test;
