STELLAR_ACCOUNT ?= deployer
STELLAR_NETWORK ?= testnet

default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32v1-none/release/*.wasm

deploy: build
	stellar contract deploy \
		--network $(STELLAR_NETWORK) \
		--source $(STELLAR_ACCOUNT) \
		--wasm target/wasm32v1-none/release/splitter.wasm

fmt:
	cargo fmt --all

clean:
	cargo clean
