import { initEccLib } from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import ECPairFactory from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';

initEccLib(ecc);

export { BigNumber } from 'bignumber.js';
export { Buffer } from 'buffer';
export * as bitcoin from 'bitcoinjs-lib';
export const bip32 = BIP32Factory(ecc);
export * as bip39 from 'bip39';
export { default as coininfo } from 'coininfo';
export const ECPair = ECPairFactory(ecc);
