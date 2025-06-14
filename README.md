# btc-signer

[![NPM Version](https://img.shields.io/npm/v/btc-signer)](https://www.npmjs.com/package/btc-signer)

Easy to use Blockbook Provider and Signer object for Bitcoin-like Coins

### Features

- Ethers.js like Provider & Signer object for Bitcoin-fork coins (Bitcoin, Litecoin, Dogecoin, etc.)

- Provider library for Blockbook & Mempool (electrs) API

- Can compose necessary signed & unsigned PSBT Transaction Object from BIP39 Mnemonic Seed / Private Key (WIF) / View only (Public Key)

- Does not require deep understanding of how to compose bitcoin transactions from scratch (the reason why this library exists).

- Taproot Support (HD Taproot Signer still WIP)

### Supported APIs

- [x] Blockbook (Recommended as it supports xpub addresses and have various coin support like Dogecoin and ZCash)

- [x] Mempool (Electrs) Instances (mempool.space, litecoinspace, blockstream.info)

- [] Blockchair (Maybe at the future)

### TO-DO

- [] More API integration (Blockchair, etc)

- [] Migrate PSBT generation from bitcoinjs to @scure/btc-signer to support bigint (to support Dogecoin, etc)

- [] Deprecate number input, only accept bigint for sat amounts

- [] Custom decimals (if possible)

- [] Dogecoin / Bitcoin Cash / Bitcoin Gold / Zcash (transparent) support

- [] Add test cases with mocking provider

- [] Add example networks like ethers.js ( that could be loaded from string, tickers. btc, ltc, would be great )

### Quick Start

```ts
// bitcoin reexports bitcoinjs lib
import { bitcoin, MnemonicWallet, MempoolProvider } from 'btc-signer';

const provider = new MempoolProvider({
    backend: 'https://mempool.space/testnet4'
});

const mnemonic = 'test test test test test test test test test test test junk';

const wallet = new MnemonicWallet(mnemonic, provider, {
    network: {
        ...bitcoin.networks.testnet,
        versions: {
            bip44: 1
        }
    }
});

// tb1pfewlxm8meyyvgjydfu7v8j4ej64symj6ut8sf66h9germp94qgzsgnnjhk
console.log(wallet.address);
// p2tr:cSBTc78h1Ab9MNcQcFD8w3kNTW8xWM4EjTQgKLDq9gUG9GrRZD3f
console.log(wallet.privateKeyWithPrefix);
// 028c7fc6552af4384a13791e63bac79ff2bcfeedf143a88d6dc4b6080a8829cdc1
console.log(wallet.publicKey);

// output is txid
wallet.sendTransaction([
    {
        address: 'tb1pfewlxm8meyyvgjydfu7v8j4ej64symj6ut8sf66h9germp94qgzsgnnjhk',
        // 1 sat
        value: 1
    }
]).then(console.log);
```

### Examples

- [Web Wallet](https://github.com/cpuchain/cpuchain-wallet) - Open source browser side web wallet

- [CPUchain Pay](https://github.com/cpuchain/cpuchain-pay) - Open source server side Node.js Payment Gateway
