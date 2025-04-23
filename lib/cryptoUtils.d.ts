import { webcrypto } from 'crypto';
export declare const textEncoder: import("util").TextEncoder;
export declare const textDecoder: import("util").TextDecoder;
export declare const isNode: boolean;
export declare const crypto: webcrypto.Crypto;
export declare function getRandomBytes(bytesLength?: number): Uint8Array<ArrayBuffer>;
export declare function hexToBytes(hexString: string): Uint8Array<ArrayBuffer>;
export declare function binaryToBytes(binaryString: string): Uint8Array<ArrayBuffer>;
export declare function base64ToBytes(baseString: string): Uint8Array<ArrayBuffer>;
export declare function bytesToHex(bytes: Uint8Array): string;
/**
 * Converts bytes array to a binary string
 * https://github.com/hujiulong/web-bip39/blob/v0.0.2/src/utils.ts#L25
 */
export declare function bytesToBinary(bytes: Uint8Array): string;
export declare function bytesToBase64(bytes: Uint8Array): string;
export declare function digest(input: Uint8Array, algorithm?: string): Promise<Uint8Array<ArrayBuffer>>;
export declare function repeatDigest(input: string, count?: number, algorithm?: string): Promise<string>;
export declare function pbkdf2(input: Uint8Array, salt: Uint8Array, iterations?: number, byteLength?: number, hash?: string): Promise<Uint8Array<ArrayBuffer>>;
/**
 * Get the Cipher key and IV for PBKDF2 encryption
 * https://gist.github.com/ayosec/d4dc24fb8f0965703c023f92b8e9cdf3
 */
export declare function getKeyAndIv(password: string, salt: Uint8Array, hash?: string, iterations?: number, cipher?: string, cipherLength?: number): Promise<{
    iv: Uint8Array<ArrayBuffer>;
    key: webcrypto.CryptoKey;
}>;
export declare function encryptString(plainString: string, password: string, saltArray?: Uint8Array, hash?: string, iterations?: number, cipher?: string, cipherLength?: number, saltSize?: number): Promise<string>;
export declare function decryptString(encryptedString: string, password: string, hash?: string, iterations?: number, cipher?: string, cipherLength?: number, saltSize?: number): Promise<string>;
