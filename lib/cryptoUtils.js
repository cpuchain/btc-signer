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
exports.crypto = exports.isNode = exports.textDecoder = exports.textEncoder = void 0;
exports.getRandomBytes = getRandomBytes;
exports.hexToBytes = hexToBytes;
exports.binaryToBytes = binaryToBytes;
exports.base64ToBytes = base64ToBytes;
exports.bytesToHex = bytesToHex;
exports.bytesToBinary = bytesToBinary;
exports.bytesToBase64 = bytesToBase64;
exports.digest = digest;
exports.repeatDigest = repeatDigest;
exports.pbkdf2 = pbkdf2;
exports.getKeyAndIv = getKeyAndIv;
exports.encryptString = encryptString;
exports.decryptString = decryptString;
const crypto_1 = require("crypto");
exports.textEncoder = new TextEncoder();
exports.textDecoder = new TextDecoder();
exports.isNode = !process.browser && typeof globalThis.window === 'undefined';
exports.crypto = exports.isNode
    ? crypto_1.webcrypto
    : globalThis.crypto;
function getRandomBytes(bytesLength = 32) {
    return exports.crypto.getRandomValues(new Uint8Array(bytesLength));
}
function hexToBytes(hexString) {
    var _a;
    if (hexString.slice(0, 2) === '0x') {
        hexString = hexString.replace('0x', '');
    }
    if (hexString.length % 2 !== 0) {
        hexString = '0' + hexString;
    }
    return Uint8Array.from(((_a = hexString.match(/.{1,2}/g)) === null || _a === void 0 ? void 0 : _a.map((byte) => parseInt(byte, 16))) || []);
}
function binaryToBytes(binaryString) {
    var _a;
    while (binaryString.length % 8 != 0) {
        binaryString = '0' + binaryString;
    }
    return new Uint8Array(((_a = binaryString.match(/(.{1,8})/g)) === null || _a === void 0 ? void 0 : _a.map((bin) => parseInt(bin, 2))) || []);
}
function base64ToBytes(baseString) {
    return Uint8Array.from(atob(baseString), (c) => c.charCodeAt(0));
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
function digest(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, algorithm = 'SHA-512') {
        return new Uint8Array(yield exports.crypto.subtle.digest(algorithm, input));
    });
}
// Repeat sha hex string operation
// Compatible with coinb.in wallet
function repeatDigest(input_1) {
    return __awaiter(this, arguments, void 0, function* (input, count = 1, algorithm = 'SHA-512') {
        // Prevent buffer output
        if (count < 1) {
            throw new Error('Invalid sha count');
        }
        for (let i = 0; i < count; ++i) {
            input = bytesToHex(yield digest(exports.textEncoder.encode(input), algorithm)).substring(2);
        }
        return '0x' + input;
    });
}
function pbkdf2(input_1, salt_1) {
    return __awaiter(this, arguments, void 0, function* (input, salt, iterations = 2048, byteLength = 512, hash = 'SHA-512') {
        const baseKey = yield exports.crypto.subtle.importKey('raw', input, 'PBKDF2', false, ['deriveBits']);
        const arrayBuffer = yield exports.crypto.subtle.deriveBits({
            name: 'PBKDF2',
            hash,
            salt,
            iterations,
        }, baseKey, byteLength);
        return new Uint8Array(arrayBuffer);
    });
}
/**
 * Get the Cipher key and IV for PBKDF2 encryption
 * https://gist.github.com/ayosec/d4dc24fb8f0965703c023f92b8e9cdf3
 */
function getKeyAndIv(password_1, salt_1) {
    return __awaiter(this, arguments, void 0, function* (password, salt, hash = 'SHA-512', iterations = 10000, cipher = 'AES-CBC', cipherLength = 256) {
        const enc = exports.textEncoder.encode(password);
        const keys = yield pbkdf2(enc, salt, iterations, cipherLength + 128, hash);
        const iv = keys.slice(cipherLength / 8);
        const key = yield exports.crypto.subtle.importKey('raw', keys.slice(0, cipherLength / 8), cipher, false, ['encrypt', 'decrypt']);
        return { iv, key };
    });
}
function encryptString(plainString_1, password_1, saltArray_1) {
    return __awaiter(this, arguments, void 0, function* (plainString, password, saltArray, hash = 'SHA-512', iterations = 10000, cipher = 'AES-CBC', cipherLength = 256, saltSize = 8) {
        const salt = saltArray || getRandomBytes(saltSize);
        const { iv, key } = yield getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);
        const cipherBuffer = new Uint8Array(yield exports.crypto.subtle.encrypt({
            name: cipher,
            iv,
        }, key, exports.textEncoder.encode(plainString)));
        const prefix = exports.textEncoder.encode('Salted__');
        const enc = new Uint8Array(prefix.byteLength + salt.byteLength + cipherBuffer.byteLength);
        enc.set(prefix, 0);
        enc.set(salt, prefix.byteLength);
        enc.set(cipherBuffer, prefix.byteLength + salt.byteLength);
        return bytesToBase64(enc);
    });
}
function decryptString(encryptedString_1, password_1) {
    return __awaiter(this, arguments, void 0, function* (encryptedString, password, hash = 'SHA-512', iterations = 10000, cipher = 'AES-CBC', cipherLength = 256, saltSize = 8) {
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
        const { iv, key } = yield getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);
        try {
            const decrypted = yield exports.crypto.subtle.decrypt({
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
    });
}
