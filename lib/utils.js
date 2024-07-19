"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.chunk = void 0;
exports.checkHex = checkHex;
exports.formatCoins = formatCoins;
exports.parseCoins = parseCoins;
exports.getDerivation = getDerivation;
exports.getBytes = getBytes;
exports.getScriptType = getScriptType;
exports.getAddress = getAddress;
exports.getPubBytes = getPubBytes;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const js_big_decimal_1 = __importDefault(require("js-big-decimal"));
const chunk = (arr, size) => [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
exports.chunk = chunk;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
function checkHex(hexStr) {
    try {
        if (hexStr.slice(0, 2) !== '0x') {
            return false;
        }
        BigInt(hexStr);
        return true;
    }
    catch (_a) {
        return false;
    }
}
function formatCoins(amount, decimals = 8) {
    return js_big_decimal_1.default.divide(amount, 10 ** decimals);
}
function parseCoins(amount, decimals = 8) {
    // todo: return bigint for sat
    return Math.floor(Number(amount) * 10 ** decimals);
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
    if (script[0] === bitcoinjs_lib_1.opcodes.OP_1 && script[1] === 32) {
        return 'taproot';
    }
    if (script[0] == bitcoinjs_lib_1.opcodes.OP_0 && script[1] == 20) {
        return 'bech32';
    }
    if (script[0] == bitcoinjs_lib_1.opcodes.OP_HASH160 && script[1] == 20) {
        return 'segwit';
    }
    if (script[0] == bitcoinjs_lib_1.opcodes.OP_DUP &&
        script[1] == bitcoinjs_lib_1.opcodes.OP_HASH160 &&
        script[2] == 20) {
        return 'legacy';
    }
    throw new Error('Unknown address');
}
function getAddress(pubkey, addrType, network) {
    if (addrType === 'taproot') {
        const internalPubkey = pubkey.slice(1, 33);
        return bitcoinjs_lib_1.payments.p2tr({
            internalPubkey,
            network,
        }).address;
    }
    else if (addrType === 'bech32') {
        return bitcoinjs_lib_1.payments.p2wpkh({
            pubkey,
            network,
        }).address;
    }
    else if (addrType === 'segwit') {
        const redeem = bitcoinjs_lib_1.payments.p2wpkh({
            pubkey,
            network,
        });
        return bitcoinjs_lib_1.payments.p2sh({
            redeem,
            network,
        }).address;
    }
    else if (addrType === 'legacy') {
        return bitcoinjs_lib_1.payments.p2pkh({
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
