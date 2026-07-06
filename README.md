<div align="center">
  <img src="frontend/public/ame.png" alt="Ame, the xflame mascot" width="120" />

  # xflame

  [![CI](https://github.com/artomily/xflame/actions/workflows/ci.yml/badge.svg)](https://github.com/artomily/xflame/actions/workflows/ci.yml)

  **The moment stablecoin income lands, it's auto-split into a stability vault, a DCA basket, and spendable cash — instead of sitting idle even a minute.**

  Built on Stellar / Soroban. React + Tailwind frontend, fronted by *Ame* the blue flame.

  **[Live demo →](https://frontend-ten-psi-12.vercel.app)**
</div>

---

## The idea

Millions of families in Indonesia and SEA receive remittances from relatives working abroad. When money lands, it either gets spent immediately or sits idle in an account earning nothing. Traditional auto-invest apps (Bibit, Acorns) are custodial and can't touch stablecoin income that never enters a bank.

**xflame** is an auto-split vault. You define a rule once; every time funds arrive they're divided across named "pockets" automatically:

- **Fixed split** — static percentages, e.g. 50% stability / 30% DCA / 20% cash.
- **Goal-based split** — priority-ordered goals (dana darurat → DP motor → …); each deposit tops up goals in order until the target is met, and anything left over lands in a spendable overflow pocket.

Near-zero Stellar fees make splitting on *every* deposit economical, and composing with audited Stellar infra (DeFindex, Soroswap) avoids bootstrapping DeFi trust from scratch.

> **Status: Phase 1 MVP** — single-player split engine with Fixed + Goal rules and manual deposit. See the [roadmap](#roadmap).

## Deployed on testnet

| | |
|---|---|
| Splitter contract | [`CDN26FLI5JYVWKPB64E46WABV2W4BAPJW2JLDADNVAK6F7N5IZY7HVZI`](https://stellar.expert/explorer/testnet/contract/CDN26FLI5JYVWKPB64E46WABV2W4BAPJW2JLDADNVAK6F7N5IZY7HVZI) |
| Deposit token (native XLM SAC) | [`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |
| `set_rule` tx (Fixed 50/30/20) | [`9bf2452c193591b36f0d1b5c0b379cd2353b6c1bd38c75519ec5a26e96c077df`](https://stellar.expert/explorer/testnet/tx/9bf2452c193591b36f0d1b5c0b379cd2353b6c1bd38c75519ec5a26e96c077df) |
| `deposit` tx (100 XLM → split) | [`0df60589537d65ed69fa755508c99b8125af39c94c5e7196a998f37efb72a390`](https://stellar.expert/explorer/testnet/tx/0df60589537d65ed69fa755508c99b8125af39c94c5e7196a998f37efb72a390) |

Verified on-chain: depositing 100 XLM against the Fixed 50/30/20 rule above produced pockets of exactly `stability: 500000000`, `dca: 300000000`, `cash: 200000000` stroops.

## Project structure

```
xflame/
├── frontend/                    # React + TypeScript + Vite + Tailwind v4
│   ├── src/
│   │   ├── App.tsx              # Shell — Vault / Faucet / Send tabs
│   │   ├── Split.tsx            # Auto-split vault: rule builder, deposit, pockets
│   │   ├── Faucet.tsx           # Testnet XLM faucet (Friendbot)
│   │   ├── Send.tsx             # Plain XLM transfer
│   │   └── stellar.ts           # Freighter wallet + Soroban contract client
│   └── bindings-splitter/       # Auto-generated splitter TypeScript client
└── contract/                    # Soroban smart contracts (Rust)
    └── contracts/
        ├── splitter/            # ⭐ Auto-split vault (the product)
        └── vault/               # Generic single-token vault primitive
```

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://www.rust-lang.org/tools/install) + `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) 27+
- [Freighter wallet](https://www.freighter.app) browser extension (set to Testnet)

```bash
rustup target add wasm32v1-none
stellar --version
```

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env      # fill in VITE_SPLITTER_CONTRACT_ID after deploying
npm run dev               # http://localhost:5173
```

Without a deployed contract the Vault runs in **preview mode**: you can design a split rule and see the live split preview, but on-chain actions (save rule / deposit / withdraw) are disabled until `VITE_SPLITTER_CONTRACT_ID` is set.

### Environment variables

```env
VITE_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_SPLITTER_CONTRACT_ID=      # deployed splitter contract ID
VITE_XLM_TOKEN_ID=              # native XLM asset contract (deposit token)
```

## Features

- **Vault** — the auto-split vault. Pick Fixed or Goal mode, build your rule, and watch a live preview of how any deposit divides across pockets. Deposit splits on-chain; withdraw per pocket; goal pockets show progress toward their target.
- **Faucet** — fund any Stellar testnet address with 10,000 XLM in one click (calls Friendbot directly — no contract needed). Handy for funding a wallet before a demo.
- **Send** — plain XLM transfer to any testnet address.

## The splitter contract

```rust
// Bind the vault to the single stablecoin it accepts (constructor)
__constructor(token: Address)

// Configure how deposits are divided
set_rule(user: Address, rule: SplitRule)

// Deposit `amount` stroops and split across pockets per the rule
deposit(user: Address, amount: i128)

// Withdraw from a specific pocket
withdraw(user: Address, pocket: Symbol, amount: i128)

// Views
pockets(user: Address) -> Map<Symbol, i128>
pocket_balance(user: Address, pocket: Symbol) -> i128
rule(user: Address) -> Option<SplitRule>

pub enum SplitRule {
    Fixed(Vec<Allocation>),          // bps must sum to 10_000
    Goal(Vec<Goal>, Symbol),         // ordered goals + overflow pocket
}
```

Balances are always preserved: the sum credited across pockets equals the deposit (the last Fixed pocket soaks any rounding remainder). For the MVP every pocket holds the same stablecoin — later phases route the stability pocket into a DeFindex vault and swap the DCA pocket via Soroswap behind the same surface.

```bash
cd contract
cargo test               # 11 tests
stellar contract build   # wasm → target/wasm32v1-none/release/splitter.wasm
```

### Deploy to testnet

```bash
# 1. Create + fund a deployer
stellar keys generate --global deployer --network testnet
stellar keys fund deployer --network testnet

# 2. Deposit token = native XLM asset contract
XLM=$(stellar contract id asset --asset native --network testnet)

# 3. Deploy (constructor takes the token address)
stellar contract deploy \
  --network testnet --source deployer \
  --wasm contract/target/wasm32v1-none/release/splitter.wasm \
  -- --token "$XLM"

# 4. Put the printed contract ID + $XLM into frontend/.env
#    VITE_SPLITTER_CONTRACT_ID=C...
#    VITE_XLM_TOKEN_ID=C...
```

TypeScript bindings are already generated in `frontend/bindings-splitter/`. Regenerate them any time with:

```bash
stellar contract bindings typescript \
  --wasm contract/target/wasm32v1-none/release/splitter.wasm \
  --output-dir frontend/bindings-splitter --overwrite
```

## Roadmap

1. **Validate & MVP (single-player)** ← *you are here* — split engine (Fixed + Goal), manual deposit, DeFindex + Soroswap for one basket, PWA + Freighter.
2. **Income-triggered automation** — split the moment funds land via streaming (StellarStream) and remittance rails (Velo Labs/Lightnet, MoneyGram MGUSD); add reactive Smart split; native app.
3. **Off-ramp / cash-out** — cash out to Rupiah / e-wallet.
4. **Account safety** — guardian-based multi-sig recovery for non-crypto-native users.
5. **Scale** — shared/group household vaults; expand to other SEA remittance corridors.

## Links

- [Soroban docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar testnet explorer](https://stellar.expert/explorer/testnet)
- [Friendbot](https://friendbot.stellar.org) — testnet XLM faucet
- [Freighter wallet](https://www.freighter.app)
