#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env};

fn balance_key(user: &Address) -> Address {
    user.clone()
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Deposit `amount` stroops of `token` into the vault.
    /// Caller must approve the vault to spend on their behalf first.
    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth();
        token::Client::new(&env, &token).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );
        let prev: i128 = env.storage().persistent().get(&balance_key(&from)).unwrap_or(0);
        env.storage().persistent().set(&balance_key(&from), &(prev + amount));
    }

    /// Withdraw `amount` stroops back to `to`.
    pub fn withdraw(env: Env, to: Address, token: Address, amount: i128) {
        to.require_auth();
        let balance: i128 = env.storage().persistent().get(&balance_key(&to)).unwrap_or(0);
        if balance < amount {
            panic!("insufficient balance");
        }
        env.storage().persistent().set(&balance_key(&to), &(balance - amount));
        token::Client::new(&env, &token).transfer(
            &env.current_contract_address(),
            &to,
            &amount,
        );
    }

    /// View deposited balance for any address.
    pub fn balance(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&balance_key(&user)).unwrap_or(0)
    }
}

mod test;
