import type { Psbt } from 'bitcoinjs-lib';
import type { BIP32Interface } from 'bip32';
import type { ECPairInterface } from 'ecpair';
import type { Bip32Derivation, TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { type CoinProvider } from './provider';
import type { addrType, CoinInfo, Output, UTXO } from './types';
export declare const RBF_INPUT_SEQUENCE = 4294967293;
export declare const DEFAULT_FEE_MULTIPLIER = 2;
export interface populateOptions {
    changeAddress?: string;
    customFeePerByte?: number;
    spendAll?: boolean;
    deductFees?: boolean;
    cachedBalance?: CoinBalance;
    requiredConfirmations?: number;
}
/**
 * Select UTXO inputs based on desired outputs
 */
export declare function getInputs(utxos: UTXO[], outputs: Output[], spendAll?: boolean): UTXO[];
export interface CoinTXProperties {
    psbt?: Psbt;
    fees: string;
    inputAmounts: string;
    inputs: UTXO[];
    outputAmounts: string;
    outputs: Output[];
    vBytes: number;
}
export declare class CoinTX {
    psbt?: Psbt;
    fees: string;
    inputAmounts: string;
    inputs: UTXO[];
    outputAmounts: string;
    outputs: Output[];
    vBytes: number;
    txid?: string;
    constructor(props: CoinTXProperties);
    toJSON(): {
        fees: string;
        inputAmounts: string;
        inputs: UTXO[];
        outputAmounts: string;
        outputs: {
            value: number;
            address: string;
            bytes: number | undefined;
        }[];
        vBytes: number;
        txid: string | undefined;
    };
}
export interface CoinBalanceProperties {
    feePerByte: number;
    utxos: UTXO[];
    utxoBalance: number;
    coinbase: number;
}
export declare class CoinBalance {
    feePerByte: number;
    utxos: UTXO[];
    utxoBalance: number;
    coinbase: number;
    constructor(props: CoinBalanceProperties);
}
export type feeMultiplier = () => Promise<number> | number;
export interface WalletOptions {
    addrType?: addrType;
    network?: CoinInfo;
    feeMultiplier?: feeMultiplier;
    generateRandom?: boolean;
    mnemonicIndex?: number;
    onlySingle?: boolean;
}
export declare class CoinWallet {
    provider: CoinProvider;
    addrType: addrType;
    network: CoinInfo;
    address: string;
    publicKey: string;
    privateKey?: string;
    privateKeyWithPrefix?: string;
    feeMultiplier?: feeMultiplier;
    constructor(privateKey: string | undefined, provider: CoinProvider, options?: WalletOptions);
    static fromBuffer(bufferKey: Buffer, provider: CoinProvider, options?: WalletOptions): CoinWallet;
    getKey(index?: number): ECPairInterface | BIP32Interface | ViewKey;
    getKeyInfo(index?: number): {
        keyPair: ECPairInterface | BIP32Interface | ViewKey;
        address: string;
        publicKey: string;
        privateKey: string;
        privateKeyWithPrefix: string;
    };
    getBip32Derivation(index?: number): (Bip32Derivation | TapBip32Derivation)[];
    getChangeAddress(): string;
    getUtxoAddress(): {
        address: string;
        isPub?: boolean;
    };
    getBalance(requiredConfirmations?: number): Promise<CoinBalance>;
    getMaxSpendable({ changeAddress, customFeePerByte, cachedBalance }?: populateOptions): Promise<number>;
    populateTransaction(outputs: Output[], { changeAddress, customFeePerByte, spendAll, deductFees, cachedBalance, requiredConfirmations, }?: populateOptions): Promise<CoinTX>;
    populatePsbt(coinTx: CoinTX): Promise<void>;
    populateConsolidation({ customFeePerByte, cachedBalance, requiredConfirmations, }?: populateOptions): Promise<CoinTX[]>;
    parseTransaction(psbtHex: string): CoinTX;
    signTransaction(psbt: Psbt, keyIndex?: number): import("bitcoinjs-lib").Transaction;
    sendTransaction(outputs: Output[], populateOptions?: populateOptions): Promise<CoinTX>;
    sendConsolidations({ customFeePerByte, cachedBalance, requiredConfirmations, }?: populateOptions): Promise<CoinTX[]>;
}
export declare class MnemonicWallet extends CoinWallet {
    mnemonic: string;
    mnemonicIndex: number;
    onlySingle: boolean;
    constructor(mnemonic: string | undefined, provider: CoinProvider, options?: WalletOptions);
    setKey(index?: number): void;
    getPub(): string;
    getUtxoAddress(): {
        address: string;
        isPub?: undefined;
    } | {
        address: string;
        isPub: boolean;
    };
    getKey(index?: number): BIP32Interface;
    getBip32Derivation(index?: number): (Bip32Derivation | TapBip32Derivation)[];
    signTransaction(psbt: Psbt): import("bitcoinjs-lib").Transaction;
}
export interface ViewKey {
    publicKey: Buffer;
    toWIF: () => string;
    tweak: (t: Buffer) => any;
}
export declare class VoidWallet extends CoinWallet {
    constructor(publicKey: string, provider: CoinProvider, options?: WalletOptions);
    getKey(index?: number): {
        publicKey: Buffer<ArrayBuffer>;
        toWIF: () => string;
        tweak: () => void;
    };
}
