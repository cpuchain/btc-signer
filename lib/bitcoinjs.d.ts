import { Buffer } from 'buffer';
import * as bitcoinJS from 'bitcoinjs-lib';
import { type BIP32API } from 'bip32';
import * as bip39 from 'bip39';
import bs58check from 'bs58check';
import { type ECPairAPI } from 'ecpair';
import { default as coininfo } from 'coininfo';
export type BitcoinJS = typeof bitcoinJS & {
    bip32: BIP32API;
    bip39: typeof bip39;
    bs58check: typeof bs58check;
    Buffer: typeof Buffer;
    coininfo: typeof coininfo;
    ECPair: ECPairAPI;
};
export declare const bitcoin: BitcoinJS;
