"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCoins = formatCoins;
exports.parseCoins = parseCoins;
exports.getDerivation = getDerivation;
exports.getBytes = getBytes;
exports.getScriptType = getScriptType;
exports.getAddress = getAddress;
exports.getPubBytes = getPubBytes;
const factory_1 = require("./factory");
const { opcodes, payments } = factory_1.bitcoin;
// todo: drop number for sats
function formatCoins(amount, decimals = 8) {
    return (0, factory_1.BigNumber)(String(amount))
        .div(10 ** decimals)
        .toString();
}
function parseCoins(amount, decimals = 8) {
    // todo: return bigint for sat
    return (0, factory_1.BigNumber)(amount)
        .times(10 ** decimals)
        .toNumber();
}
function getDerivation(addrType) {
    switch (addrType) {
        // https://github.com/bitcoin/bips/blob/master/bip-0086.mediawiki
        case 'taproot':
            return 86;
        // https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki
        case 'bech32':
            return 84;
        // https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
        case 'segwit':
            return 49;
        // https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
        default:
            return 44;
    }
}
function getBytes(addrType, isInput = true) {
    switch (addrType) {
        case 'taproot':
            return isInput ? 58 : 43;
        case 'bech32':
            return isInput ? 68 : 31;
        case 'segwit':
            return isInput ? 91 : 32;
        case 'legacy':
            return isInput ? 148 : 34;
        default:
            return isInput ? 392 : 34;
    }
}
function getScriptType(script) {
    if (script[0] === opcodes.OP_1 && script[1] === 32) {
        return 'taproot';
    }
    if (script[0] == opcodes.OP_0 && script[1] == 20) {
        return 'bech32';
    }
    if (script[0] == opcodes.OP_HASH160 && script[1] == 20) {
        return 'segwit';
    }
    if (script[0] == opcodes.OP_DUP && script[1] == opcodes.OP_HASH160 && script[2] == 20) {
        return 'legacy';
    }
    throw new Error('Unknown address');
}
function getAddress(pubkey, addrType, network) {
    if (addrType === 'taproot') {
        const internalPubkey = pubkey.slice(1, 33);
        return payments.p2tr({
            internalPubkey,
            network,
        }).address;
    }
    else if (addrType === 'bech32') {
        return payments.p2wpkh({
            pubkey,
            network,
        }).address;
    }
    else if (addrType === 'segwit') {
        const redeem = payments.p2wpkh({
            pubkey,
            network,
        });
        return payments.p2sh({
            redeem,
            network,
        }).address;
    }
    else if (addrType === 'legacy') {
        return payments.p2pkh({
            pubkey,
            network,
        }).address;
    }
}
function getPubBytes(addrType) {
    switch (addrType) {
        case 'segwit':
            // ypub
            return '049d7cb2';
        case 'bech32':
            // zpub
            return '04b24746';
        default:
            // xpub
            return '0488b21e';
    }
}
