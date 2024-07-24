"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHexWithIdLegacy = generateHexWithIdLegacy;
exports.generateHexWithId = generateHexWithId;
exports.getEntropy = getEntropy;
exports.getMnemonic = getMnemonic;
exports.getRandomMnemonic = getRandomMnemonic;
exports.generateMnemonicWithId = generateMnemonicWithId;
const bip39_1 = require("bip39");
const cryptoUtils_1 = require("./cryptoUtils");
/**
 * Legacy coinb.in style hex string generation with email and password
 */
function generateHexWithIdLegacy(email, pass) {
    var _a, _b, _c;
    let s = email;
    s += '|' + pass + '|';
    s += s.length + '|!@' + (pass.length * 7 + email.length) * 7;
    const regchars = ((_a = pass.match(/[a-z]+/g)) === null || _a === void 0 ? void 0 : _a.length) || 1;
    const regupchars = ((_b = pass.match(/[A-Z]+/g)) === null || _b === void 0 ? void 0 : _b.length) || 1;
    const regnums = ((_c = pass.match(/[0-9]+/g)) === null || _c === void 0 ? void 0 : _c.length) || 1;
    s += (regnums + regchars + regupchars) * pass.length + '3571';
    s += s + '' + s;
    return (0, cryptoUtils_1.repeatDigest)(s, 52, 'SHA-256');
}
function generateHexWithId(id_1, password_1) {
    return __awaiter(this, arguments, void 0, function* (id, password, thirdParams = [], nonce = 0) {
        var _a, _b, _c;
        if (id.length < 5 || password.length < 5) {
            throw new Error('Invalid id or password length, must longer than 5');
        }
        id = id.normalize('NFKD');
        password = password.normalize('NFKD');
        if (thirdParams.length) {
            thirdParams = thirdParams.map((t) => t.normalize('NFKD'));
        }
        let s = id + '|' + password + '|';
        if (thirdParams.length) {
            s += thirdParams.join('|') + '|';
        }
        s +=
            s.length +
                '|!@' +
                `${(password.length * 7 + id.length + thirdParams.length) * 7}`;
        const regchars = ((_a = password.match(/[a-z]+/g)) === null || _a === void 0 ? void 0 : _a.length) || 1;
        const regupchars = ((_b = password.match(/[A-Z]+/g)) === null || _b === void 0 ? void 0 : _b.length) || 1;
        const regnums = ((_c = password.match(/[0-9]+/g)) === null || _c === void 0 ? void 0 : _c.length) || 1;
        s +=
            `${(regnums + regchars + regupchars + nonce) * password.length}` +
                `${id.length}${password.length}${thirdParams.length}${nonce}`;
        // Repeat string 3 times
        s += '|' + s + '|' + s;
        const [hashedHexString, saltHexString] = yield Promise.all([
            (0, cryptoUtils_1.repeatDigest)(s, 10 + nonce),
            (0, cryptoUtils_1.repeatDigest)(s.slice(0, Math.floor(s.length / 2)), 7 + nonce),
        ]);
        const encryptedHexString = (0, cryptoUtils_1.bytesToHex)(yield (0, cryptoUtils_1.pbkdf2)(cryptoUtils_1.textEncoder.encode(hashedHexString.substring(2)), cryptoUtils_1.textEncoder.encode(saltHexString.substring(2))));
        const hashedString = yield (0, cryptoUtils_1.repeatDigest)(encryptedHexString.substring(2), 50 + nonce);
        return hashedString;
    });
}
/**
 * Get iancoleman style hashed entropy for specific mnemonic length
 */
function getEntropy(initEntropy, mnemonicLength) {
    return __awaiter(this, void 0, void 0, function* () {
        const shaHex = yield (0, cryptoUtils_1.digest)(cryptoUtils_1.textEncoder.encode(initEntropy), 'SHA-256');
        let bins = (0, cryptoUtils_1.bytesToBinary)(shaHex);
        while (bins.length % 256 != 0) {
            bins = '0' + bins;
        }
        // Truncate the hash to suit a number of words
        const numberOfBins = (32 * mnemonicLength) / 3;
        bins = bins.substring(0, numberOfBins);
        return (0, cryptoUtils_1.bytesToHex)((0, cryptoUtils_1.binaryToBytes)(bins)).substring(2);
    });
}
function getMnemonic(entropy, mnemonicLength) {
    return __awaiter(this, void 0, void 0, function* () {
        // Return mnemonic as is
        if (!mnemonicLength) {
            const mnemonic = (0, bip39_1.entropyToMnemonic)(Buffer.from(entropy, 'hex'));
            const seed = (yield (0, bip39_1.mnemonicToSeed)(mnemonic)).toString('hex');
            return {
                mnemonic,
                seed,
            };
        }
        const newEntropy = yield getEntropy(entropy, mnemonicLength);
        const mnemonic = (0, bip39_1.entropyToMnemonic)(Buffer.from(newEntropy, 'hex'));
        const seed = (yield (0, bip39_1.mnemonicToSeed)(mnemonic)).toString('hex');
        return {
            newEntropy,
            mnemonic,
            seed,
        };
    });
}
function getRandomMnemonic(mnemonicLength) {
    return __awaiter(this, void 0, void 0, function* () {
        const entropy = (0, cryptoUtils_1.bytesToHex)(cryptoUtils_1.crypto.getRandomValues(new Uint8Array(64))).substring(2);
        const { newEntropy, mnemonic, seed } = yield getMnemonic(entropy, mnemonicLength);
        return {
            entropy: newEntropy || entropy,
            mnemonic,
            seed,
        };
    });
}
function generateMnemonicWithId(id_1, password_1) {
    return __awaiter(this, arguments, void 0, function* (id, password, thirdParams = [], mnemonicLength, nonce = 0) {
        const hex = yield generateHexWithId(id, password, thirdParams, nonce);
        const prefixLength = 2;
        const entropy = hex.slice(prefixLength, prefixLength + 64);
        const entropy2 = hex.slice(prefixLength + 64);
        const [{ newEntropy, mnemonic, seed }, { newEntropy: newEntropy2, mnemonic: mnemonic2, seed: seed2 },] = yield Promise.all([
            getMnemonic(entropy, mnemonicLength),
            getMnemonic(entropy2, mnemonicLength),
        ]);
        return {
            hex,
            entropy: newEntropy || entropy,
            entropy2: newEntropy2 || entropy2,
            mnemonic,
            mnemonic2,
            seed,
            seed2,
        };
    });
}
exports.default = generateMnemonicWithId;
