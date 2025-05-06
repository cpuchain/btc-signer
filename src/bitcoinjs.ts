import { Buffer } from 'buffer';
import * as bitcoinJS from 'bitcoinjs-lib';
import BIP32Factory, { type BIP32API } from 'bip32';
import * as bip39 from 'bip39';
import bs58check from 'bs58check';
import ECPairFactory, { type ECPairAPI } from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';
import { default as coininfo } from 'coininfo';

export type BitcoinJS = typeof bitcoinJS & {
    bip32: BIP32API;
    bip39: typeof bip39;
    bs58check: typeof bs58check;
    Buffer: typeof Buffer;
    coininfo: typeof coininfo;
    ECPair: ECPairAPI;
};

export const bitcoin = bitcoinJS as unknown as BitcoinJS;

// Prevent DOM import error
// No need to init on child lib since it is already done on bitcoin.umd.js
if (bitcoin?.initEccLib) {
    bitcoin.initEccLib(ecc);
    bitcoin.bip32 = BIP32Factory(ecc);
    bitcoin.bip39 = bip39;
    bitcoin.bs58check = bs58check;
    bitcoin.Buffer = Buffer;
    bitcoin.coininfo = coininfo;
    bitcoin.ECPair = ECPairFactory(ecc);
}
