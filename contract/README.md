# xflame — Soroban contracts

Smart contracts for xflame. See the [root README](../README.md) for the product overview.

## Structure

```text
.
├── contracts
│   ├── splitter        # ⭐ Auto-split vault (Fixed + Goal split rules) — the product
│   │   ├── src/lib.rs
│   │   ├── src/test.rs
│   │   └── Cargo.toml
│   └── vault           # Generic single-token deposit/withdraw primitive
├── Cargo.toml          # workspace
└── README.md
```

## Common commands

```bash
cargo test                       # run all contract tests
stellar contract build           # build all contracts to wasm

# per-contract Makefile targets (build / test / deploy / fmt)
make -C contracts/splitter test
make -C contracts/splitter deploy STELLAR_ACCOUNT=deployer
```

Each contract has its own `Cargo.toml` and relies on the workspace `Cargo.toml` for shared dependencies. See the root README for full splitter deploy instructions (its constructor takes the deposit-token address).
