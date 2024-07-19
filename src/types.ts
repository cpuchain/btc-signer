import type { Network } from 'bitcoinjs-lib';

export const electrumKeys = {
    taproot: 'p2tr',
    bech32: 'p2wpkh',
    segwit: 'p2wpkh-p2sh',
    legacy: 'p2pkh',
    p2tr: 'taproot',
    p2wpkh: 'bech32',
    'p2wpkh-p2sh': 'segwit',
    p2pkh: 'legacy',
};

export type addrType = keyof typeof electrumKeys;

export const addrTypes: Array<addrType> = [
    'legacy',
    'segwit',
    'bech32',
    'taproot',
];

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
    confirmations?: number;
    address?: string;
    addressIndex?: number;
    path?: string;
    coinbase?: boolean;
};
