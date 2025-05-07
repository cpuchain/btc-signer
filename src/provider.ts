import { chunk, sleep } from './utils';
import { parseCoins } from './coinUtils';
import type { UTXO, TX } from './types';

// Minute
export const DEFAULT_TIMEOUT = 60000;

export interface ProviderOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchOptions?: any;
    txChunks?: number;
    range?: number; // max scan range
}

/**
 * Blockbook Instance Provider
 *
 * Should support CORS with OPTIONS Preflight requests when connected from browser
 */
export class CoinProvider {
    backend: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchOptions?: any;
    txChunks: number;
    range: number; // max scan range

    constructor(backend: string, options?: ProviderOptions) {
        this.backend = backend;
        this.fetchOptions = options?.fetchOptions;
        this.txChunks = options?.txChunks || 10;
        this.range = options?.range || 20;
    }

    async estimateFee(): Promise<number> {
        const resp = await fetch(`${this.backend}/api/v2/estimatefee/1`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        const { result, error } = (await resp.json()) as {
            result?: number;
            error?: string;
        };

        if (error) {
            throw new Error(error);
        }

        return Math.floor(parseCoins(Number(result) / 1000));
    }

    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        const { error, blockbook } = (await resp.json()) as {
            error?: string;
            blockbook?: {
                bestHeight: number;
            };
        };

        if (error) {
            throw new Error(error);
        }

        return Number(blockbook?.bestHeight);
    }

    async getUnspent(address: string, scan = false): Promise<UTXO[]> {
        let utxoUrl = `${this.backend}/api/v2/utxo/${address}`;

        if (scan) {
            utxoUrl += `?gap=${this.range}`;
        }

        const resp = await fetch(utxoUrl, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const utxos = (await resp.json()) as any;

        if (utxos.error) {
            throw new Error(utxos.error);
        }

        // Return UTXOs in an ascending order as we want to spend the oldest coins first
        return (utxos as UTXO[])
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

    async getTransactions(txs: string[]): Promise<TX[]> {
        const results: TX[] = [];

        for (const chunks of chunk(txs, this.txChunks)) {
            const chunkResults = await Promise.all(
                chunks.map(async (tx, index) => {
                    await sleep(10 * index);

                    const resp = await fetch(`${this.backend}/api/v2/tx/${tx}`, {
                        ...(this.fetchOptions || {}),
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
                    });

                    if (!resp.ok) {
                        throw new Error(await resp.text());
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const result = (await resp.json()) as any;

                    if (result.error) {
                        throw new Error(result.error);
                    }

                    return result as TX;
                }),
            );

            results.push(...chunkResults);
        }

        return results;
    }

    async broadcastTransaction(signedTx: string) {
        const resp = await fetch(`${this.backend}/api/v2/sendtx/`, {
            ...(this.fetchOptions || {}),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: signedTx,
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        const { result, error } = (await resp.json()) as {
            result: string;
            error?: string;
        };

        if (error) {
            throw new Error(error);
        }

        return result;
    }
}

export class MempoolProvider extends CoinProvider {
    async estimateFee(): Promise<number> {
        const resp = await fetch(`${this.backend}/api/v1/fees/recommended`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        const data = (await resp.json()) as {
            fastestFee?: number;
            halfHourFee?: number;
            hourFee?: number;
            economyFee?: number;
            minimumFee?: number;

            error?: string;
        };

        if (data.error) {
            throw new Error(data.error);
        }

        return Math.floor(Number(data.fastestFee));
    }

    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        // API throws whatever reason
        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        return Number(await resp.text());
    }

    private async getUtxoInternal(address: string) {
        const resp = await fetch(`${this.backend}/api/address/${address}/utxo`, {
            ...(this.fetchOptions || {}),
            method: 'GET',
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        // API throws Invalid Bitcoin address
        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await resp.json()) as any[];
    }

    async getUnspent(address: string): Promise<UTXO[]> {
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

    async getTransactions(txs: string[]): Promise<TX[]> {
        const results: TX[] = [];

        for (const chunks of chunk(txs, this.txChunks)) {
            const chunkResults = await Promise.all(
                chunks.map(async (tx, index) => {
                    await sleep(10 * index);

                    const resp = await fetch(`${this.backend}/api/tx/${tx}/hex`, {
                        ...(this.fetchOptions || {}),
                        method: 'GET',
                        signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
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
                }),
            );

            results.push(...chunkResults);
        }

        return results;
    }

    async broadcastTransaction(signedTx: string) {
        const resp = await fetch(`${this.backend}/api/tx`, {
            ...(this.fetchOptions || {}),
            method: 'POST',
            body: signedTx,
            signal: AbortSignal.timeout(this.fetchOptions?.timeout || DEFAULT_TIMEOUT),
        });

        const txid = await resp.text();

        // API throws sendrawtransaction RPC error
        if (!resp.ok) {
            throw new Error(txid);
        }

        return txid;
    }
}
