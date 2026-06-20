#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol, Vec};

const NOTES_KEY: Symbol = symbol_short!("NOTES");
const COUNTER_KEY: Symbol = symbol_short!("CNT");

#[contracttype]
#[derive(Clone)]
pub struct Note {
    pub content: String,
    pub id: u64,
    pub title: String,
}

#[contract]
pub struct NotesContract;

#[contractimpl]
impl NotesContract {
    pub fn get_notes(env: Env) -> Vec<Note> {
        env.storage()
            .persistent()
            .get(&NOTES_KEY)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn create_note(env: Env, title: String, content: String) -> String {
        let mut notes: Vec<Note> = env
            .storage()
            .persistent()
            .get(&NOTES_KEY)
            .unwrap_or_else(|| Vec::new(&env));

        let next_id: u64 = env
            .storage()
            .persistent()
            .get(&COUNTER_KEY)
            .unwrap_or(0u64)
            + 1;

        notes.push_back(Note { id: next_id, title, content });

        env.storage().persistent().set(&NOTES_KEY, &notes);
        env.storage().persistent().set(&COUNTER_KEY, &next_id);

        String::from_str(&env, "ok")
    }

    pub fn delete_note(env: Env, id: u64) {
        let notes: Vec<Note> = env
            .storage()
            .persistent()
            .get(&NOTES_KEY)
            .unwrap_or_else(|| Vec::new(&env));

        let mut filtered = Vec::new(&env);
        for note in notes.iter() {
            if note.id != id {
                filtered.push_back(note);
            }
        }

        env.storage().persistent().set(&NOTES_KEY, &filtered);
    }
}

mod test;
