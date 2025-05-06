import { webcrypto } from 'crypto';

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNode = !(process as any)?.browser && typeof (globalThis as any).window === 'undefined';

export const crypto = isNode ? webcrypto : (globalThis.crypto as typeof webcrypto);

export function hexToBytes(input: bigint | string): Uint8Array {
    let hex: string = typeof input === 'bigint' ? input.toString(16) : input;
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return Uint8Array.from((hex.match(/.{1,2}/g) as string[]).map((byte) => parseInt(byte, 16)));
}

export function binaryToBytes(binaryString: string) {
    while (binaryString.length % 8 != 0) {
        binaryString = '0' + binaryString;
    }
    return new Uint8Array(binaryString.match(/(.{1,8})/g)?.map((bin) => parseInt(bin, 2)) || []);
}

export function base64ToBytes(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export function bytesToHex(bytes: Uint8Array): string {
    return (
        '0x' +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    );
}

/**
 * Converts bytes array to a binary string
 * https://github.com/hujiulong/web-bip39/blob/v0.0.2/src/utils.ts#L25
 */
export function bytesToBinary(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(2).padStart(8, '0'))
        .join('');
}

export function bytesToBase64(bytes: Uint8Array): string {
    return btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
}

export function rBytes(bytesLength = 32): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(bytesLength));
}

export async function digest(input: Uint8Array, algorithm = 'SHA-512'): Promise<Uint8Array> {
    return new Uint8Array(await crypto.subtle.digest(algorithm, input));
}

// Repeat sha hex string operation
// Compatible with coinb.in wallet
export async function repeatDigest(input: string, count = 1, algorithm = 'SHA-512'): Promise<string> {
    // Prevent buffer output
    if (count < 1) {
        throw new Error('Invalid sha count');
    }
    for (let i = 0; i < count; ++i) {
        input = bytesToHex(await digest(textEncoder.encode(input), algorithm)).substring(2);
    }
    return '0x' + input;
}

export async function pbkdf2(
    input: Uint8Array,
    salt: Uint8Array,
    iterations = 2048,
    byteLength = 512,
    hash = 'SHA-512',
): Promise<Uint8Array> {
    const baseKey = await crypto.subtle.importKey('raw', input, 'PBKDF2', false, ['deriveBits']);

    const arrayBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash,
            salt,
            iterations,
        },
        baseKey,
        byteLength,
    );

    return new Uint8Array(arrayBuffer);
}

/**
 * Get the Cipher key and IV for PBKDF2 encryption
 * https://gist.github.com/ayosec/d4dc24fb8f0965703c023f92b8e9cdf3
 */
export async function getKeyAndIv(
    password: string,
    salt: Uint8Array,
    hash = 'SHA-512',
    iterations = 10000,
    cipher = 'AES-CBC',
    cipherLength = 256,
): Promise<{ iv: Uint8Array; key: webcrypto.CryptoKey }> {
    const enc = textEncoder.encode(password);

    const keys = await pbkdf2(enc, salt, iterations, cipherLength + 128, hash);

    const iv = keys.slice(cipherLength / 8);

    const key = await crypto.subtle.importKey('raw', keys.slice(0, cipherLength / 8), cipher, false, [
        'encrypt',
        'decrypt',
    ]);

    return { iv, key };
}

export async function encryptString(
    plainString: string,
    password: string,
    saltArray?: Uint8Array,
    hash = 'SHA-512',
    iterations = 10000,
    cipher = 'AES-CBC',
    cipherLength = 256,
    saltSize = 8,
): Promise<string> {
    const salt = saltArray || rBytes(saltSize);

    const { iv, key } = await getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);

    const cipherBuffer = new Uint8Array(
        await crypto.subtle.encrypt(
            {
                name: cipher,
                iv,
            },
            key,
            textEncoder.encode(plainString),
        ),
    );

    const prefix = textEncoder.encode('Salted__');

    const enc = new Uint8Array(prefix.byteLength + salt.byteLength + cipherBuffer.byteLength);
    enc.set(prefix, 0);
    enc.set(salt, prefix.byteLength);
    enc.set(cipherBuffer, prefix.byteLength + salt.byteLength);

    return bytesToBase64(enc);
}

export async function decryptString(
    encryptedString: string,
    password: string,
    hash = 'SHA-512',
    iterations = 10000,
    cipher = 'AES-CBC',
    cipherLength = 256,
    saltSize = 8,
): Promise<string> {
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

    if (textDecoder.decode(prefix) !== 'Salted__') {
        throw new Error('Encrypted data not salted?');
    }

    // 2. Determine key using PBKDF2
    const { iv, key } = await getKeyAndIv(password, salt, hash, iterations, cipher, cipherLength);

    try {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: cipher,
                iv,
            },
            key,
            data,
        );

        return textDecoder.decode(decrypted);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        // e.message is blank when the password or data is incorrect and thus we create our new custom error message
        if (!e.message) {
            throw new Error(
                'Failed to decrypt with blank error, make sure you have the correct data / password',
            );
        }
        throw e;
    }
}
