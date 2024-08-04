import type { Network } from 'bitcoinjs-lib';
export declare const electrumKeys: {
    taproot: string;
    bech32: string;
    segwit: string;
    legacy: string;
    p2tr: string;
    p2wpkh: string;
    'p2wpkh-p2sh': string;
    p2pkh: string;
};
export type addrType = keyof typeof electrumKeys;
export declare const addrTypes: Array<addrType>;
export type CoinInfo = Network & {
    versions: {
        bip44: number;
    };
};
export interface TX {
    txid: string;
    hex: string;
}
export interface Input {
    txid: string;
    vout: number;
    value: number;
    bytes?: number;
}
export interface Output {
    address: string;
    value: number;
    returnData?: string;
    script?: Buffer;
    bytes?: number;
}
export type UTXO = Input & {
    height: number;
    confirmations: number;
    address?: string;
    addressIndex?: number;
    path?: string;
    coinbase?: boolean;
};
