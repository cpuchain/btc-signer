export { mnemonicToEntropy, mnemonicToSeed } from 'bip39';
/**
 * Legacy coinb.in style hex string generation with email and password
 */
export declare function generateHexWithIdLegacy(email: string, pass: string): Promise<string>;
export declare function generateHexWithId(id: string, password: string, thirdParams?: string[], nonce?: number): Promise<string>;
/**
 * Get iancoleman style hashed entropy for specific mnemonic length
 */
export declare function getEntropy(initEntropy: string, mnemonicLength: number): Promise<string>;
export declare function getMnemonic(entropy: string, mnemonicLength?: number): Promise<{
    mnemonic: string;
    seed: string;
    newEntropy?: undefined;
} | {
    newEntropy: string;
    mnemonic: string;
    seed: string;
}>;
export declare function getRandomMnemonic(mnemonicLength?: number): Promise<{
    entropy: string;
    mnemonic: string;
    seed: string;
}>;
export declare function generateMnemonicWithId(id: string, password: string, thirdParams?: string[], mnemonicLength?: number, nonce?: number): Promise<{
    hex: string;
    entropy: string;
    entropy2: string;
    mnemonic: string;
    mnemonic2: string;
    seed: string;
    seed2: string;
}>;
export default generateMnemonicWithId;
