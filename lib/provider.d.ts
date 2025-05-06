import type { UTXO, TX } from './types';
export declare const DEFAULT_FEE_MULTIPLIER = 2;
export type feeMultiplier = () => Promise<number> | number;
export interface ProviderConfig {
    backend: string;
    fetchOptions?: any;
    feeFallback?: number;
    feeMultiplier?: feeMultiplier;
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
    fetchOptions?: any;
    feeFallback: number;
    feeMultiplier?: feeMultiplier;
    txChunks: number;
    range: number;
    constructor(config: ProviderConfig);
    estimateFee(): Promise<number>;
    getBlockNumber(): Promise<number>;
    getUnspent(address: string, scan?: boolean): Promise<UTXO[]>;
    getTransactions(txs: string[]): Promise<TX[]>;
    broadcastTransaction(signedTx: string): Promise<string>;
}
export declare class MempoolProvider extends CoinProvider {
    estimateFee(): Promise<number>;
    getBlockNumber(): Promise<number>;
    private getUtxoInternal;
    getUnspent(address: string): Promise<UTXO[]>;
    getTransactions(txs: string[]): Promise<TX[]>;
    broadcastTransaction(signedTx: string): Promise<string>;
}
export default CoinProvider;
