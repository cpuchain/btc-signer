"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addrTypes = exports.electrumKeys = void 0;
exports.electrumKeys = {
    taproot: 'p2tr',
    bech32: 'p2wpkh',
    segwit: 'p2wpkh-p2sh',
    legacy: 'p2pkh',
    p2tr: 'taproot',
    p2wpkh: 'bech32',
    'p2wpkh-p2sh': 'segwit',
    p2pkh: 'legacy',
};
exports.addrTypes = ['legacy', 'segwit', 'bech32', 'taproot'];
