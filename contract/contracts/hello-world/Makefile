default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32v1-none/release/*.wasm

# Usage: make deploy-testnet STELLAR_ACCOUNT=<your-account-name-or-secret>
deploy-testnet: build
	stellar contract deploy \
		--network testnet \
		--source $(STELLAR_ACCOUNT) \
		--wasm target/wasm32v1-none/release/notes.wasm

# After deploy, regenerate frontend bindings:
# stellar contract bindings typescript \
#   --network testnet \
#   --contract-id <CONTRACT_ID> \
#   --output-dir ../frontend/bindings

fmt:
	cargo fmt --all

clean:
	cargo clean
