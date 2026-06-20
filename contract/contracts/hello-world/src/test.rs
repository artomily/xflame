#![cfg(test)]
use super::*;
use soroban_sdk::{Env, String};

#[test]
fn test_create_and_get() {
    let env = Env::default();
    let contract_id = env.register(NotesContract, ());
    let client = NotesContractClient::new(&env, &contract_id);

    let result = client.create_note(
        &String::from_str(&env, "Hello"),
        &String::from_str(&env, "World"),
    );
    assert_eq!(result, String::from_str(&env, "ok"));

    let notes = client.get_notes();
    assert_eq!(notes.len(), 1);

    let note = notes.get(0).unwrap();
    assert_eq!(note.title, String::from_str(&env, "Hello"));
    assert_eq!(note.content, String::from_str(&env, "World"));
    assert_eq!(note.id, 1u64);
}

#[test]
fn test_delete_note() {
    let env = Env::default();
    let contract_id = env.register(NotesContract, ());
    let client = NotesContractClient::new(&env, &contract_id);

    client.create_note(
        &String::from_str(&env, "Note 1"),
        &String::from_str(&env, "Content 1"),
    );
    client.create_note(
        &String::from_str(&env, "Note 2"),
        &String::from_str(&env, "Content 2"),
    );

    let id = client.get_notes().get(0).unwrap().id;
    client.delete_note(&id);

    let notes = client.get_notes();
    assert_eq!(notes.len(), 1);
    assert_eq!(notes.get(0).unwrap().title, String::from_str(&env, "Note 2"));
}

#[test]
fn test_counter_increments() {
    let env = Env::default();
    let contract_id = env.register(NotesContract, ());
    let client = NotesContractClient::new(&env, &contract_id);

    client.create_note(&String::from_str(&env, "A"), &String::from_str(&env, "1"));
    client.create_note(&String::from_str(&env, "B"), &String::from_str(&env, "2"));

    let notes = client.get_notes();
    assert_eq!(notes.get(0).unwrap().id, 1u64);
    assert_eq!(notes.get(1).unwrap().id, 2u64);
}
