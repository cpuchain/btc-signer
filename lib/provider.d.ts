import type { UTXO, TX } from './types';
export interface ProviderConfig {
    backend: string;
    feeFallback?: number;
    feeMultiplier?: number;
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
    feeFallback: number;
    feeMultiplier: number;
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
