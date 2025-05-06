"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mnemonicToSeed = exports.mnemonicToEntropy = exports.entropyToMnemonic = void 0;
exports.generateHexWithIdLegacy = generateHexWithIdLegacy;
exports.generateHexWithId = generateHexWithId;
exports.getEntropy = getEntropy;
exports.getMnemonic = getMnemonic;
exports.getRandomMnemonic = getRandomMnemonic;
exports.generateMnemonicWithId = generateMnemonicWithId;
const factory_1 = require("./factory");
const cryptoUtils_1 = require("./cryptoUtils");
const { bip39, Buffer } = factory_1.bitcoin;
exports.entropyToMnemonic = bip39.entropyToMnemonic;
exports.mnemonicToEntropy = bip39.mnemonicToEntropy;
exports.mnemonicToSeed = bip39.mnemonicToSeed;
/**
 * Legacy coinb.in style hex string generation with email and password
 */
function generateHexWithIdLegacy(email, pass) {
    let s = email;
    s += '|' + pass + '|';
    s += s.length + '|!@' + (pass.length * 7 + email.length) * 7;
    const regchars = pass.match(/[a-z]+/g)?.length || 1;
    const regupchars = pass.match(/[A-Z]+/g)?.length || 1;
    const regnums = pass.match(/[0-9]+/g)?.length || 1;
    s += (regnums + regchars + regupchars) * pass.length + '3571';
    s += s + '' + s;
    return (0, cryptoUtils_1.repeatDigest)(s, 52, 'SHA-256');
}
async function generateHexWithId(id, password, thirdParams = [], nonce = 0) {
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
    s += s.length + '|!@' + `${(password.length * 7 + id.length + thirdParams.length) * 7}`;
    const regchars = password.match(/[a-z]+/g)?.length || 1;
    const regupchars = password.match(/[A-Z]+/g)?.length || 1;
    const regnums = password.match(/[0-9]+/g)?.length || 1;
    s +=
        `${(regnums + regchars + regupchars + nonce) * password.length}` +
            `${id.length}${password.length}${thirdParams.length}${nonce}`;
    // Repeat string 3 times
    s += '|' + s + '|' + s;
    const [hashedHexString, saltHexString] = await Promise.all([
        (0, cryptoUtils_1.repeatDigest)(s, 10 + nonce),
        (0, cryptoUtils_1.repeatDigest)(s.slice(0, Math.floor(s.length / 2)), 7 + nonce),
    ]);
    const encryptedHexString = (0, cryptoUtils_1.bytesToHex)(await (0, cryptoUtils_1.pbkdf2)(cryptoUtils_1.textEncoder.encode(hashedHexString.substring(2)), cryptoUtils_1.textEncoder.encode(saltHexString.substring(2))));
    const hashedString = await (0, cryptoUtils_1.repeatDigest)(encryptedHexString.substring(2), 50 + nonce);
    return hashedString;
}
/**
 * Get iancoleman style hashed entropy for specific mnemonic length
 */
async function getEntropy(initEntropy, mnemonicLength) {
    const shaHex = await (0, cryptoUtils_1.digest)(cryptoUtils_1.textEncoder.encode(initEntropy), 'SHA-256');
    let bins = (0, cryptoUtils_1.bytesToBinary)(shaHex);
    while (bins.length % 256 != 0) {
        bins = '0' + bins;
    }
    // Truncate the hash to suit a number of words
    const numberOfBins = (32 * mnemonicLength) / 3;
    bins = bins.substring(0, numberOfBins);
    return (0, cryptoUtils_1.bytesToHex)((0, cryptoUtils_1.binaryToBytes)(bins)).substring(2);
}
async function getMnemonic(entropy, mnemonicLength) {
    // Return mnemonic as is
    if (!mnemonicLength) {
        const mnemonic = (0, exports.entropyToMnemonic)(Buffer.from(entropy, 'hex'));
        const seed = (await (0, exports.mnemonicToSeed)(mnemonic)).toString('hex');
        return {
            mnemonic,
            seed,
        };
    }
    const newEntropy = await getEntropy(entropy, mnemonicLength);
    const mnemonic = (0, exports.entropyToMnemonic)(Buffer.from(newEntropy, 'hex'));
    const seed = (await (0, exports.mnemonicToSeed)(mnemonic)).toString('hex');
    return {
        newEntropy,
        mnemonic,
        seed,
    };
}
async function getRandomMnemonic(mnemonicLength) {
    const entropy = (0, cryptoUtils_1.bytesToHex)(cryptoUtils_1.crypto.getRandomValues(new Uint8Array(32))).substring(2);
    const { newEntropy, mnemonic, seed } = await getMnemonic(entropy, mnemonicLength);
    return {
        entropy: newEntropy || entropy,
        mnemonic,
        seed,
    };
}
async function generateMnemonicWithId(id, password, thirdParams = [], mnemonicLength, nonce = 0) {
    const hex = await generateHexWithId(id, password, thirdParams, nonce);
    const prefixLength = 2;
    const entropy = hex.slice(prefixLength, prefixLength + 64);
    const entropy2 = hex.slice(prefixLength + 64);
    const [{ newEntropy, mnemonic, seed }, { newEntropy: newEntropy2, mnemonic: mnemonic2, seed: seed2 }] = await Promise.all([getMnemonic(entropy, mnemonicLength), getMnemonic(entropy2, mnemonicLength)]);
    return {
        hex,
        entropy: newEntropy || entropy,
        entropy2: newEntropy2 || entropy2,
        mnemonic,
        mnemonic2,
        seed,
        seed2,
    };
}
exports.default = generateMnemonicWithId;
