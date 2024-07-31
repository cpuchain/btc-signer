"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MempoolProvider = exports.CoinProvider = void 0;
const utils_1 = require("./utils");
const coinUtils_1 = require("./coinUtils");
/**
 * Blockbook Instance Provider
 *
 * Should support CORS with OPTIONS Preflight requests when connected from browser
 */
class CoinProvider {
    constructor(config) {
        this.backend = config.backend;
        this.feeFallback = config.feeFallback || 0.00001;
        this.feeMultiplier = config.feeMultiplier || 2;
        this.txChunks = config.txChunks || 10;
        this.range = config.range || 20;
    }
    estimateFee() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = (yield (yield fetch(`${this.backend}/api/v2/estimatefee/1`, {
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
                return Math.floor((0, coinUtils_1.parseCoins)((parsedFee * this.feeMultiplier) / 1000));
            }
            catch (_a) {
                return Math.floor((0, coinUtils_1.parseCoins)(this.feeFallback / 1000));
            }
        });
    }
    getUnspent(address_1) {
        return __awaiter(this, arguments, void 0, function* (address, scan = false) {
            let utxoUrl = `${this.backend}/api/v2/utxo/${address}`;
            if (scan) {
                utxoUrl += `?gap=${this.range}`;
            }
            const utxos = (yield (yield fetch(utxoUrl, {
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
                utxo.height = Number(utxo.height);
                return utxo;
            })
                .sort((a, b) => {
                if (a.height === b.height) {
                    return a.vout - b.vout;
                }
                return Number(a.height) - Number(b.height);
            });
        });
    }
    getTransactions(txs) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const chunks of (0, utils_1.chunk)(txs, this.txChunks)) {
                const chunkResults = yield Promise.all(chunks.map((tx, index) => __awaiter(this, void 0, void 0, function* () {
                    yield (0, utils_1.sleep)(10 * index);
                    const result = (yield (yield fetch(`${this.backend}/api/v2/tx/${tx}`, {
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
                })));
                results.push(...chunkResults);
            }
            return results;
        });
    }
    broadcastTransaction(signedTx) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield fetch(`${this.backend}/api/v2/sendtx/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: signedTx,
            });
            const data = (yield resp.json());
            if (data.error) {
                throw new Error(data.error);
            }
            return data.result;
        });
    }
}
exports.CoinProvider = CoinProvider;
class MempoolProvider extends CoinProvider {
    estimateFee() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = (yield (yield fetch(`${this.backend}/api/v1/fees/recommended`, {
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
                return Math.floor(parsedFee * this.feeMultiplier);
            }
            catch (_a) {
                return Math.floor((0, coinUtils_1.parseCoins)(this.feeFallback / 1000));
            }
        });
    }
    getUnspent(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield fetch(`${this.backend}/api/address/${address}/utxo`, {
                method: 'GET',
            });
            // API throws Invalid Bitcoin address
            if (!resp.ok) {
                throw new Error(yield resp.text());
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const utxos = (yield resp.json());
            // Return UTXOs in an ascending order as we want to spend the oldest coins first
            return utxos
                .map((utxo) => {
                var _a;
                return ({
                    txid: utxo.txid,
                    vout: utxo.vout,
                    // Pending UTXO would be NaN and would sorted first
                    height: Number((_a = utxo.status) === null || _a === void 0 ? void 0 : _a.block_height),
                    value: Number(utxo.value),
                });
            })
                .sort((a, b) => {
                if (a.height === b.height) {
                    return a.vout - b.vout;
                }
                return a.height - b.height;
            });
        });
    }
    getTransactions(txs) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const chunks of (0, utils_1.chunk)(txs, this.txChunks)) {
                const chunkResults = yield Promise.all(chunks.map((tx, index) => __awaiter(this, void 0, void 0, function* () {
                    yield (0, utils_1.sleep)(10 * index);
                    const resp = yield fetch(`${this.backend}/api/tx/${tx}/hex`, {
                        method: 'GET',
                    });
                    const hex = yield resp.text();
                    // API throws Transaction not found
                    if (!resp.ok) {
                        throw new Error(hex);
                    }
                    return {
                        txid: tx,
                        hex,
                    };
                })));
                results.push(...chunkResults);
            }
            return results;
        });
    }
    broadcastTransaction(signedTx) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield fetch(`${this.backend}/api/tx`, {
                method: 'POST',
                body: signedTx,
            });
            const txid = yield resp.text();
            // API throws sendrawtransaction RPC error
            if (!resp.ok) {
                throw new Error(txid);
            }
            return txid;
        });
    }
}
exports.MempoolProvider = MempoolProvider;
exports.default = CoinProvider;
