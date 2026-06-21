# xflame

Stellar DeFi toolkit — swap tokens, manage on-chain notes, and fund testnet accounts. Built on Soroban smart contracts with a React + Tailwind frontend.

## Project structure

```
xflame/
├── frontend/          # React + TypeScript + Vite + Tailwind v4
│   ├── src/
│   │   ├── App.tsx        # Main app — Notes and Faucet tabs
│   │   ├── Faucet.tsx     # Testnet XLM faucet (Friendbot)
│   │   └── stellar.ts     # Freighter wallet + contract client
│   └── bindings/          # Auto-generated contract TypeScript client
└── contract/          # Soroban smart contracts (Rust)
    └── contracts/
        └── hello-world/   # Notes contract (get, create, delete)
```

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://www.rust-lang.org/tools/install) + `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) 27+
- [Freighter wallet](https://www.freighter.app) browser extension (set to Testnet)

```bash
# Add Rust wasm target
rustup target add wasm32v1-none

# Verify Stellar CLI
stellar --version
```

## Frontend

```bash
cd frontend
npm install

# Copy env and fill in your contract ID
cp .env.example .env

npm run dev       # http://localhost:5173
npm run build
```

### Environment variables

```env
VITE_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_CONTRACT_ID=<your deployed contract ID>
```

### Features

**Faucet tab** — Fund any Stellar testnet address with 10,000 XLM in one click. Paste an address or connect Freighter to auto-fill. No contract required — calls Friendbot directly.

**Notes tab** — Connect Freighter to read and write notes stored on-chain via the Soroban contract. Requires `VITE_STELLAR_CONTRACT_ID` to be set.

## Contract

```bash
cd contract

# Run tests
cargo test

# Build WASM
stellar contract build
```

### Deploy to testnet

**1. Create and fund a deployer account**

```bash
stellar keys generate --global deployer --network testnet
stellar keys fund deployer --network testnet
```

**2. Deploy**

```bash
# Via Makefile
make deploy-testnet STELLAR_ACCOUNT=deployer

# Or directly
stellar contract deploy \
  --network testnet \
  --source deployer \
  --wasm target/wasm32v1-none/release/notes.wasm
```

Copy the contract ID that's printed (starts with `C`).

**3. Update frontend env**

```bash
# frontend/.env
VITE_STELLAR_CONTRACT_ID=<contract ID from step 2>
```

**4. Regenerate TypeScript bindings**

```bash
cd frontend
stellar contract bindings typescript \
  --network testnet \
  --contract-id <contract ID> \
  --output-dir bindings \
  --overwrite
```

**5. Restart the dev server**

```bash
npm run dev
```

## Contract interface

```rust
// Get all notes
get_notes() -> Vec<Note>

// Create a note — returns "ok"
create_note(title: String, content: String) -> String

// Delete a note by ID
delete_note(id: u64)

pub struct Note {
    pub id:      u64,
    pub title:   String,
    pub content: String,
}
```

Notes are stored in persistent ledger storage. IDs auto-increment.

## Useful links

- [Soroban docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar testnet explorer](https://stellar.expert/explorer/testnet)
- [Friendbot](https://friendbot.stellar.org) — testnet XLM faucet
- [Freighter wallet](https://www.freighter.app)
