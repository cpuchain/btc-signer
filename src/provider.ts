import { chunk, sleep } from './utils';
import { parseCoins } from './coinUtils';
import type { UTXO, TX } from './types';

export interface ProviderConfig {
    backend: string;
    feeFallback?: number;
    feeMultiplier?: number;
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
    feeFallback: number;
    feeMultiplier: number;
    txChunks: number;
    range: number; // max scan range

    constructor(config: ProviderConfig) {
        this.backend = config.backend;
        this.feeFallback = config.feeFallback || 0.00001;
        this.feeMultiplier = config.feeMultiplier || 2;
        this.txChunks = config.txChunks || 10;
        this.range = config.range || 20;
    }

    async estimateFee(): Promise<number> {
        try {
            const data = (await (
                await fetch(`${this.backend}/api/v2/estimatefee/1`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            ).json()) as {
                result?: number;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error?: string;
            };

            if (data.error) {
                throw new Error(data.error);
            }

            let parsedFee = Number(data.result);

            if (!parsedFee || parsedFee < this.feeFallback) {
                parsedFee = this.feeFallback;
            }

            return Math.floor(
                parseCoins((parsedFee * this.feeMultiplier) / 1000),
            );
        } catch {
            return Math.floor(parseCoins(this.feeFallback / 1000));
        }
    }

    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            method: 'GET',
        });

        const data = (await resp.json()) as {
            error?: string;
            blockbook?: {
                bestHeight: number;
            };
        };

        if (data.error) {
            throw new Error(data.error);
        }

        return Number(data.blockbook?.bestHeight);
    }

    async getUnspent(
        address: string,
        scan: boolean = false,
    ): Promise<Array<UTXO>> {
        let utxoUrl = `${this.backend}/api/v2/utxo/${address}`;

        if (scan) {
            utxoUrl += `?gap=${this.range}`;
        }

        const utxos = (await (
            await fetch(utxoUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .json()) as any;

        if (utxos.error) {
            throw new Error(utxos.error);
        }

        // Return UTXOs in an ascending order as we want to spend the oldest coins first
        return (utxos as Array<UTXO>)
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

    async getTransactions(txs: Array<string>): Promise<Array<TX>> {
        const results: Array<TX> = [];

        for (const chunks of chunk(txs, this.txChunks)) {
            const chunkResults = await Promise.all(
                chunks.map(async (tx, index) => {
                    await sleep(10 * index);

                    const result = (await (
                        await fetch(`${this.backend}/api/v2/tx/${tx}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })
                    )
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .json()) as any;

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
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: signedTx,
        });

        const data = (await resp.json()) as {
            result: string;
            error?: string;
        };

        if (data.error) {
            throw new Error(data.error);
        }

        return data.result;
    }
}

export class MempoolProvider extends CoinProvider {
    async estimateFee(): Promise<number> {
        try {
            const data = (await (
                await fetch(`${this.backend}/api/v1/fees/recommended`, {
                    method: 'GET',
                })
            ).json()) as {
                fastestFee?: number;
                halfHourFee?: number;
                hourFee?: number;
                economyFee?: number;
                minimumFee?: number;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error?: string;
            };

            if (data.error) {
                throw new Error(data.error);
            }

            const fallbackFee = parseCoins(this.feeFallback / 1000);

            let parsedFee = Number(data.fastestFee);

            if (!parsedFee || parsedFee < fallbackFee) {
                parsedFee = fallbackFee;
            }

            return Math.floor(parsedFee * this.feeMultiplier);
        } catch {
            return Math.floor(parseCoins(this.feeFallback / 1000));
        }
    }

    async getBlockNumber() {
        const resp = await fetch(`${this.backend}/api/blocks/tip/height`, {
            method: 'GET',
        });

        // API throws whatever reason
        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        return Number(await resp.text());
    }

    private async getUtxoInternal(address: string) {
        const resp = await fetch(
            `${this.backend}/api/address/${address}/utxo`,
            {
                method: 'GET',
            },
        );

        // API throws Invalid Bitcoin address
        if (!resp.ok) {
            throw new Error(await resp.text());
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await resp.json()) as Array<any>;
    }

    async getUnspent(address: string): Promise<Array<UTXO>> {
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

    async getTransactions(txs: Array<string>): Promise<Array<TX>> {
        const results: Array<TX> = [];

        for (const chunks of chunk(txs, this.txChunks)) {
            const chunkResults = await Promise.all(
                chunks.map(async (tx, index) => {
                    await sleep(10 * index);

                    const resp = await fetch(
                        `${this.backend}/api/tx/${tx}/hex`,
                        {
                            method: 'GET',
                        },
                    );

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

export default CoinProvider;
