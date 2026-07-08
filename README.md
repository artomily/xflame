<div align="center">
  <img src="frontend/public/ame.png" alt="Ame, the xflame mascot" width="120" />

  # xflame

  [![CI](https://github.com/artomily/xflame/actions/workflows/ci.yml/badge.svg)](https://github.com/artomily/xflame/actions/workflows/ci.yml)

  **The moment stablecoin income lands, it's auto-split into a stability vault, a DCA basket, and spendable cash — instead of sitting idle even a minute.**

  Built on Stellar / Soroban. React + Tailwind frontend, fronted by *Ame* the blue flame.

  **[Live demo →](https://xflame.vercel.app)**

  <a href="https://youtu.be/kdpUCG3ZmGs">
    <img src="https://img.youtube.com/vi/kdpUCG3ZmGs/maxresdefault.jpg" alt="Watch the xflame demo" width="640" />
  </a>

  <sub>▶ Watch the demo video</sub>
</div>

---

## The problem

Millions of families in Indonesia and SEA receive remittances from relatives working abroad. Getting paid in stablecoins instead of through a bank is already a huge upgrade — it lands in seconds and fees are near zero.

But that's where it stops. The moment the money arrives, it just **sits idle** in a wallet:

- No savings discipline, no investing, no budget — just a balance that doesn't move.
- Traditional auto-invest apps (Bibit, Acorns, …) are custodial and can't touch stablecoin income that never enters a bank.
- Managing it manually (moving % to savings, % to DCA, % to spend) is tedious enough that most people just... don't.

**The hard part was never receiving the money. It's what happens the second after it lands — and right now, nobody's managing that.**

## The solution

**xflame** is an auto-split vault. You define a split rule once; every time funds arrive they're divided across named "pockets" automatically, on-chain:

- **Fixed split** — static percentages, e.g. 50% stability / 30% DCA / 20% cash.
- **Goal-based split** — priority-ordered goals (dana darurat → DP motor → …); each deposit tops up goals in order until the target is met, and anything left over lands in a spendable overflow pocket.

Near-zero Stellar fees make splitting on *every* deposit economical, and composing with audited Stellar infra (DeFindex, Soroswap) avoids bootstrapping DeFi trust from scratch.

> **Status: Phase 1 MVP** — single-player split engine with Fixed + Goal rules and manual deposit. See the [roadmap](#roadmap).

### How it works

```mermaid
flowchart LR
    A["💰 Stablecoin income\narrives in wallet"] --> B{Split rule}
    B -->|Fixed 50%| C["🛡️ Stability pocket"]
    B -->|Fixed 30%| D["📈 DCA pocket"]
    B -->|Fixed 20%| E["💵 Cash pocket\n(spendable)"]

    B -.Goal mode.-> F["🎯 Goal 1\n(priority)"]
    F -->|target met| G["🎯 Goal 2\n(priority)"]
    G -->|overflow| E
```

1. **Set a rule once** — Fixed percentages or priority-ordered Goals.
2. **Income lands** — stablecoin arrives from family abroad, no bank or custodian in the middle.
3. **It auto-splits** — every deposit divides across pockets on-chain, instantly.

### Architecture

```mermaid
graph TD
    U["User"] -->|"Email demo sign-in\nor Freighter wallet"| FE["Frontend\nReact + Vite + Tailwind"]
    FE -->|Soroban RPC| RPC["Stellar Soroban RPC\n(testnet)"]
    RPC --> SC["Splitter contract\n(Rust / Soroban)"]
    SC --> P1[("Pocket: stability")]
    SC --> P2[("Pocket: dca")]
    SC --> P3[("Pocket: cash")]
    FB["Friendbot faucet"] -.funds testnet wallet.-> U
```

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

```mermaid
timeline
    title xflame roadmap
    Phase 1 · you are here : Split engine (Fixed + Goal)
                            : Manual deposit
                            : DeFindex + Soroswap for one basket
                            : PWA + Freighter
    Phase 2 · Automate and cash out : Income-triggered split (StellarStream)
                                     : Remittance rails (Velo Labs/Lightnet, MoneyGram MGUSD)
                                     : AI-assisted Smart split agent
                                     : Native app
                                     : Off-ramp to Rupiah / e-wallet
    Phase 3 · Trust and scale : Guardian-based multi-sig recovery
                               : AI advisor agent for household vaults
                               : Expand to other SEA remittance corridors
```

1. **Validate & MVP (single-player)** ← *you are here* — split engine (Fixed + Goal), manual deposit, DeFindex + Soroswap for one basket, PWA + Freighter.
2. **Automate & cash out** — income-triggered split the moment funds land via streaming (StellarStream) and remittance rails (Velo Labs/Lightnet, MoneyGram MGUSD); an AI-assisted Smart split agent handles rebalance/timing; native app; off-ramp to Rupiah / e-wallet — closing the loop from income to spendable cash.
3. **Trust & scale** — guardian-based multi-sig recovery for non-crypto-native users; an AI advisor agent for shared household vaults; expand to other SEA remittance corridors.

## Links

- [Soroban docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar testnet explorer](https://stellar.expert/explorer/testnet)
- [Friendbot](https://friendbot.stellar.org) — testnet XLM faucet
- [Freighter wallet](https://www.freighter.app)
