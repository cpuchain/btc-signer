import type { BlockbookParams, Blockbook } from 'blockbook-fetcher';
import type { UTXO, TX } from './types';
export declare const DEFAULT_TIMEOUT = 60000;
export interface ProviderOptions extends BlockbookParams {
    txChunks?: number;
    range?: number;
}
/**
 * Blockbook Instance Provider
 *
 * Should support CORS with OPTIONS Preflight requests when connected from browser
 */
export declare class CoinProvider {
    backend: string;
    blockbook?: Blockbook;
    fetchOptions?: any;
    txChunks: number;
    range: number;
    constructor(backend: string, options?: ProviderOptions);
    estimateFee(): Promise<number>;
    getBlockNumber(): Promise<number>;
    getUnspent(address: string, scan?: boolean): Promise<UTXO[]>;
    getTransactions(txs: string[]): Promise<TX[]>;
    broadcastTransaction(signedTx: string): Promise<string>;
}
export declare class MempoolProvider extends CoinProvider {
    blockbook: undefined;
    constructor(backend: string, options?: ProviderOptions);
    estimateFee(): Promise<number>;
    getBlockNumber(): Promise<number>;
    private getUtxoInternal;
    getUnspent(address: string): Promise<UTXO[]>;
    getTransactions(txs: string[]): Promise<TX[]>;
    broadcastTransaction(signedTx: string): Promise<string>;
}
