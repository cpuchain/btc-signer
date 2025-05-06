"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MempoolProvider = exports.CoinProvider = exports.DEFAULT_FEE_MULTIPLIER = void 0;
const utils_1 = require("./utils");
const coinUtils_1 = require("./coinUtils");
exports.DEFAULT_FEE_MULTIPLIER = 2;
/**
 * Blockbook Instance Provider
 *
 * Should support CORS with OPTIONS Preflight requests when connected from browser
 */
class CoinProvider {
    backend;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchOptions;
    feeFallback;
    feeMultiplier;
    txChunks;
    range; // max scan range
    constructor(config) {
        this.backend = config.backend;
        this.fetchOptions = config.fetchOptions;
        this.feeFallback = config.feeFallback || 0.00001;
        this.feeMultiplier = config.feeMultiplier;
        this.txChunks = config.txChunks || 10;
        this.range = config.range || 20;
    }
    async estimateFee() {
        try {
            const data = (await (await fetch(`${this.backend}/api/v2/estimatefee/1`, {
                ...(this.fetchOptions || {}),
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })).json());
            if (data.error) {
                throw new Error(data.error);
            }
            let parsedFee = Number(data.result);
            if (!parsedFee || parsedFee < this.feeFallback) {
                parsedFee = this.feeFallback;
            }
            const feeMultiplier = (await this.feeMultiplier?.()) || exports.DEFAULT_FEE_MULTIPLIER;
            return Math.floor((0, coinUtils_1.parseCoins)((parsedFee * feeMultiplier) / 1000));
        }
        catch {
            return Math.floor((0, coinUtils_1.parseCoins)(this.feeFallback / 1000));
        }
    }
    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
        });
        const data = (await resp.json());
        if (data.error) {
            throw new Error(data.error);
        }
        return Number(data.blockbook?.bestHeight);
    }
    async getUnspent(address, scan = false) {
        let utxoUrl = `${this.backend}/api/v2/utxo/${address}`;
        if (scan) {
            utxoUrl += `?gap=${this.range}`;
        }
        const utxos = (await (await fetch(utxoUrl, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .json());
        if (utxos.error) {
            throw new Error(utxos.error);
        }
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
                const result = (await (await fetch(`${this.backend}/api/v2/tx/${tx}`, {
                    ...(this.fetchOptions || {}),
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }))
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .json());
                if (result.error) {
                    throw new Error(result.error);
                }
                return result;
            }));
            results.push(...chunkResults);
        }
        return results;
    }
    async broadcastTransaction(signedTx) {
        const resp = await fetch(`${this.backend}/api/v2/sendtx/`, {
            ...(this.fetchOptions || {}),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: signedTx,
        });
        const data = (await resp.json());
        if (data.error) {
            throw new Error(data.error);
        }
        return data.result;
    }
}
exports.CoinProvider = CoinProvider;
class MempoolProvider extends CoinProvider {
    async estimateFee() {
        try {
            const data = (await (await fetch(`${this.backend}/api/v1/fees/recommended`, {
                ...(this.fetchOptions || {}),
                method: 'GET',
            })).json());
            if (data.error) {
                throw new Error(data.error);
            }
            const fallbackFee = (0, coinUtils_1.parseCoins)(this.feeFallback / 1000);
            let parsedFee = Number(data.fastestFee);
            if (!parsedFee || parsedFee < fallbackFee) {
                parsedFee = fallbackFee;
            }
            const feeMultiplier = (await this.feeMultiplier?.()) || exports.DEFAULT_FEE_MULTIPLIER;
            return Math.floor(parsedFee * feeMultiplier);
        }
        catch {
            return Math.floor((0, coinUtils_1.parseCoins)(this.feeFallback / 1000));
        }
    }
    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
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
exports.default = CoinProvider;
