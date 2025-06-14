"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = exports.isNode = exports.textDecoder = exports.textEncoder = void 0;
exports.hexToBytes = hexToBytes;
exports.binaryToBytes = binaryToBytes;
exports.base64ToBytes = base64ToBytes;
exports.bytesToHex = bytesToHex;
exports.bytesToBinary = bytesToBinary;
exports.bytesToBase64 = bytesToBase64;
exports.rBytes = rBytes;
exports.digest = digest;
exports.repeatDigest = repeatDigest;
exports.pbkdf2 = pbkdf2;
exports.getKeyAndIv = getKeyAndIv;
exports.encryptString = encryptString;
exports.decryptString = decryptString;
const crypto_1 = require("crypto");
exports.textEncoder = new TextEncoder();
exports.textDecoder = new TextDecoder();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.isNode = !process?.browser && typeof globalThis.window === 'undefined';
exports.crypto = exports.isNode ? crypto_1.webcrypto : globalThis.crypto;
function hexToBytes(input) {
    let hex = typeof input === 'bigint' ? input.toString(16) : input;
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}
function binaryToBytes(binaryString) {
    while (binaryString.length % 8 != 0) {
        binaryString = '0' + binaryString;
    }
    return new Uint8Array(binaryString.match(/(.{1,8})/g)?.map((bin) => parseInt(bin, 2)) || []);
}
function base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
function bytesToHex(bytes) {
    return ('0x' +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''));
}
/**
 * Converts bytes array to a binary string
 * https://github.com/hujiulong/web-bip39/blob/v0.0.2/src/utils.ts#L25
 */
function bytesToBinary(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(2).padStart(8, '0'))
        .join('');
}
function bytesToBase64(bytes) {
    return btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
}
function rBytes(bytesLength = 32) {
    return exports.crypto.getRandomValues(new Uint8Array(bytesLength));
}
async function digest(input, algorithm = 'SHA-512') {
    return new Uint8Array(await exports.crypto.subtle.digest(algorithm, input));
}
// Repeat sha hex string operation
// Compatible with coinb.in wallet
async function repeatDigest(input, count = 1, algorithm = 'SHA-512') {
    // Prevent buffer output
    if (count < 1) {
        throw new Error('Invalid sha count');
    }
    for (let i = 0; i < count; ++i) {
        input = bytesToHex(await digest(exports.textEncoder.encode(input), algorithm)).substring(2);
    }
    return '0x' + input;
}
async function pbkdf2(input, salt, iterations = 2048, byteLength = 512, hash = 'SHA-512') {
    const baseKey = await exports.crypto.subtle.importKey('raw', input, 'PBKDF2', false, ['deriveBits']);
    const arrayBuffer = await exports.crypto.subtle.deriveBits({
        name: 'PBKDF2',
        hash,
        salt,
        iterations,
    }, baseKey, byteLength);
    return new Uint8Array(arrayBuffer);
}
/**
 * Get the Cipher key and IV for PBKDF2 encryption
 * https://gist.github.com/ayosec/d4dc24fb8f0965703c023f92b8e9cdf3
 */
async function getKeyAndIv(password, salt, hash = 'SHA-512', iterations = 10000, cipher = 'AES-CBC', cipherLength = 256) {
    const enc = exports.textEncoder.encode(password);
    const keys = await pbkdf2(enc, salt, iterations, cipherLength + 128, hash);
    const iv = keys.slice(cipherLength / 8);
    const key = await exports.crypto.subtle.importKey('raw', keys.slice(0, cipherLength / 8), cipher, false, [
        'encrypt',
        'decrypt',
    ]);
    return { iv, key };
}
async function encryptString(plainString, password, saltArray, hash = 'SHA-512', iterations = 10000, cipher = 'AES-CBC', cipherLength = 256, saltSize = 8) {
    const salt = saltArray || rBytes(saltSize);
    const { iv, key } = await getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);
    const cipherBuffer = new Uint8Array(await exports.crypto.subtle.encrypt({
        name: cipher,
        iv,
    }, key, exports.textEncoder.encode(plainString)));
    const prefix = exports.textEncoder.encode('Salted__');
    const enc = new Uint8Array(prefix.byteLength + salt.byteLength + cipherBuffer.byteLength);
    enc.set(prefix, 0);
    enc.set(salt, prefix.byteLength);
    enc.set(cipherBuffer, prefix.byteLength + salt.byteLength);
    return bytesToBase64(enc);
}
async function decryptString(encryptedString, password, hash = 'SHA-512', iterations = 10000, cipher = 'AES-CBC', cipherLength = 256, saltSize = 8) {
    // 1. Separate ciphertext, salt, and iv
    const enc = base64ToBytes(encryptedString);
    // Salted__ prefix
    const prefixLength = 8;
    // 8 bytes salt: 0x0123456789ABCDEF
    const saltLength = prefixLength + saltSize; // 16
    // Prefix
    const prefix = enc.slice(0, prefixLength);
    // Salt and IV
    const salt = enc.slice(prefixLength, saltLength);
    // ciphertext
    const data = enc.slice(saltLength);
    if (exports.textDecoder.decode(prefix) !== 'Salted__') {
        throw new Error('Encrypted data not salted?');
    }
    // 2. Determine key using PBKDF2
    const { iv, key } = await getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);
    try {
        const decrypted = await exports.crypto.subtle.decrypt({
            name: cipher,
            iv,
        }, key, data);
        return exports.textDecoder.decode(decrypted);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (e) {
        // e.message is blank when the password or data is incorrect and thus we create our new custom error message
        if (!e.message) {
            throw new Error('Failed to decrypt with blank error, make sure you have the correct data / password');
        }
        throw e;
    }
}
