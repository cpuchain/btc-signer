import { entropyToMnemonic, mnemonicToSeed } from 'bip39';

import {
    crypto,
    digest,
    textEncoder,
    bytesToHex,
    repeatDigest,
    pbkdf2,
    bytesToBinary,
    binaryToBytes,
} from './cryptoUtils';

/**
 * Legacy coinb.in style hex string generation with email and password
 */
export function generateHexWithIdLegacy(email: string, pass: string) {
    let s = email;
    s += '|' + pass + '|';
    s += s.length + '|!@' + (pass.length * 7 + email.length) * 7;
    const regchars = pass.match(/[a-z]+/g)?.length || 1;
    const regupchars = pass.match(/[A-Z]+/g)?.length || 1;
    const regnums = pass.match(/[0-9]+/g)?.length || 1;
    s += (regnums + regchars + regupchars) * pass.length + '3571';
    s += s + '' + s;

    return repeatDigest(s, 52, 'SHA-256');
}

export async function generateHexWithId(
    id: string,
    password: string,
    thirdParams: Array<string> = [],
    nonce: number = 0,
) {
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
    const regchars = password.match(/[a-z]+/g)?.length || 1;
    const regupchars = password.match(/[A-Z]+/g)?.length || 1;
    const regnums = password.match(/[0-9]+/g)?.length || 1;
    s +=
        `${(regnums + regchars + regupchars + nonce) * password.length}` +
        `${id.length}${password.length}${thirdParams.length}${nonce}`;
    // Repeat string 3 times
    s += '|' + s + '|' + s;

    const [hashedHexString, saltHexString] = await Promise.all([
        repeatDigest(s, 10 + nonce),
        repeatDigest(s.slice(0, Math.floor(s.length / 2)), 7 + nonce),
    ]);

    const encryptedHexString = bytesToHex(
        await pbkdf2(
            textEncoder.encode(hashedHexString.substring(2)),
            textEncoder.encode(saltHexString.substring(2)),
        ),
    );

    const hashedString = await repeatDigest(
        encryptedHexString.substring(2),
        50 + nonce,
    );

    return hashedString;
}

/**
 * Get iancoleman style hashed entropy for specific mnemonic length
 */
export async function getEntropy(initEntropy: string, mnemonicLength: number) {
    const shaHex = await digest(textEncoder.encode(initEntropy), 'SHA-256');

    let bins = bytesToBinary(shaHex);

    while (bins.length % 256 != 0) {
        bins = '0' + bins;
    }

    // Truncate the hash to suit a number of words
    const numberOfBins = (32 * mnemonicLength) / 3;
    bins = bins.substring(0, numberOfBins);

    return bytesToHex(binaryToBytes(bins)).substring(2);
}

export async function getMnemonic(entropy: string, mnemonicLength?: number) {
    // Return mnemonic as is
    if (!mnemonicLength) {
        const mnemonic = entropyToMnemonic(Buffer.from(entropy, 'hex'));

        const seed = (await mnemonicToSeed(mnemonic)).toString('hex');

        return {
            mnemonic,
            seed,
        };
    }

    const newEntropy = await getEntropy(entropy, mnemonicLength);

    const mnemonic = entropyToMnemonic(Buffer.from(newEntropy, 'hex'));

    const seed = (await mnemonicToSeed(mnemonic)).toString('hex');

    return {
        newEntropy,
        mnemonic,
        seed,
    };
}

export async function getRandomMnemonic(mnemonicLength?: number) {
    const entropy = bytesToHex(
        crypto.getRandomValues(new Uint8Array(64)),
    ).substring(2);

    const { newEntropy, mnemonic, seed } = await getMnemonic(
        entropy,
        mnemonicLength,
    );

    return {
        entropy: newEntropy || entropy,
        mnemonic,
        seed,
    };
}

export async function generateMnemonicWithId(
    id: string,
    password: string,
    thirdParams: Array<string> = [],
    mnemonicLength?: number,
    nonce: number = 0,
) {
    const hex = await generateHexWithId(id, password, thirdParams, nonce);

    const prefixLength = 2;
    const entropy = hex.slice(prefixLength, prefixLength + 64);
    const entropy2 = hex.slice(prefixLength + 64);

    const [
        { newEntropy, mnemonic, seed },
        { newEntropy: newEntropy2, mnemonic: mnemonic2, seed: seed2 },
    ] = await Promise.all([
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
}

export default generateMnemonicWithId;
