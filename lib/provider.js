"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MempoolProvider = exports.CoinProvider = exports.DEFAULT_TIMEOUT = void 0;
const factory_1 = require("./factory");
const utils_1 = require("./utils");
const coinUtils_1 = require("./coinUtils");
const { Blockbook: _Blockbook } = factory_1.blockbook;
// Minute
exports.DEFAULT_TIMEOUT = 60000;
/**
 * Blockbook Instance Provider
 *
 * Should support CORS with OPTIONS Preflight requests when connected from browser
 */
class CoinProvider {
    backend;
    blockbook;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchOptions;
    txChunks;
    range; // max scan range
    constructor(backend, options) {
        this.backend = backend;
        this.blockbook = new _Blockbook(backend, options);
        this.fetchOptions = options?.fetchOptions;
        this.txChunks = options?.txChunks || 10;
        this.range = options?.range || 20;
    }
    async estimateFee() {
        const result = await this.blockbook.estimateFee();
        return Math.floor((0, coinUtils_1.parseCoins)(Number(result) / 1000));
    }
    async getBlockNumber() {
        const result = await this.blockbook.getStatus();
        return Number(result.backend.blocks);
    }
    async getUnspent(address, scan = false) {
        const utxos = await this.blockbook.getUtxo(address, {
            gap: scan ? this.range : undefined,
        });
        // Return UTXOs in an ascending order as we want to spend the oldest coins first
        return utxos
            .map((utxo) => {
            const pathSplit = utxo.path ? utxo.path.split('/') : [];
            if (pathSplit[pathSplit.length - 1]) {
                utxo.addressIndex = Number(pathSplit[pathSplit.length - 1]);
            }
            utxo.value = Number(utxo.value);
            // Pending UTXO would be NaN and would sorted first
            // blockbook always return confirmations as well
            utxo.height = Number(utxo.height);
            return utxo;
        })
            .sort((a, b) => {
            if (a.height === b.height) {
                return a.vout - b.vout;
            }
            return a.height - b.height;
        });
    }
    async getTransactions(txs) {
        const results = [];
        for (const chunks of (0, utils_1.chunk)(txs, this.txChunks)) {
            const chunkResults = await Promise.all(chunks.map(async (tx, index) => {
                await (0, utils_1.sleep)(10 * index);
                return this.blockbook.getTransaction(tx);
            }));
            results.push(...chunkResults);
        }
        return results;
    }
    async broadcastTransaction(signedTx) {
        return this.blockbook.sendTransaction(signedTx);
    }
}
exports.CoinProvider = CoinProvider;
class MempoolProvider extends CoinProvider {
    blockbook;
    constructor(backend, options) {
        super(backend, options);
        this.blockbook = undefined;
    }
    async estimateFee() {
        const resp = await fetch(`${this.backend}/api/v1/fees/recommended`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || exports.DEFAULT_TIMEOUT),
        });
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const data = (await resp.json());
        if (data.error) {
            throw new Error(data.error);
        }
        return Math.floor(Number(data.fastestFee));
    }
    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || exports.DEFAULT_TIMEOUT),
        });
        // API throws whatever reason
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        return Number(await resp.text());
    }
    async getUtxoInternal(address) {
        const resp = await fetch(`${this.backend}/api/address/${address}/utxo`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || exports.DEFAULT_TIMEOUT),
        });
        // API throws Invalid Bitcoin address
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await resp.json());
    }
    async getUnspent(address) {
        const [blockHeight, utxos] = await Promise.all([
            this.getBlockNumber(),
            this.getUtxoInternal(address),
        ]);
        // Return UTXOs in an ascending order as we want to spend the oldest coins first
        return utxos
            .map((utxo) => {
            // Pending UTXO would be NaN and would sorted first
            const height = Number(utxo.status?.block_height);
            const confirmations = height ? blockHeight - height + 1 : 0;
            return {
                txid: utxo.txid,
                vout: utxo.vout,
                height,
                confirmations,
                value: Number(utxo.value),
            };
        })
            .sort((a, b) => {
            if (a.height === b.height) {
                return a.vout - b.vout;
            }
            return a.height - b.height;
        });
    }
    async getTransactions(txs) {
        const results = [];
        for (const chunks of (0, utils_1.chunk)(txs, this.txChunks)) {
            const chunkResults = await Promise.all(chunks.map(async (tx, index) => {
                await (0, utils_1.sleep)(10 * index);
                const resp = await fetch(`${this.backend}/api/tx/${tx}/hex`, {
                    ...(this.fetchOptions || {}),
                    method: 'GET',
                    signal: AbortSignal.timeout(this.fetchOptions?.timeout || exports.DEFAULT_TIMEOUT),
                });
                const hex = await resp.text();
                // API throws Transaction not found
                if (!resp.ok) {
                    throw new Error(hex);
                }
                return {
                    txid: tx,
                    hex,
                };
            }));
            results.push(...chunkResults);
        }
        return results;
    }
    async broadcastTransaction(signedTx) {
        const resp = await fetch(`${this.backend}/api/tx`, {
            ...(this.fetchOptions || {}),
            method: 'POST',
            body: signedTx,
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || exports.DEFAULT_TIMEOUT),
        });
        const txid = await resp.text();
        // API throws sendrawtransaction RPC error
        if (!resp.ok) {
            throw new Error(txid);
        }
        return txid;
    }
}
exports.MempoolProvider = MempoolProvider;
