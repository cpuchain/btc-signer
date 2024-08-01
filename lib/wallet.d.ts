import { Psbt, Transaction } from 'bitcoinjs-lib';
import type { BIP32Interface } from 'bip32';
import type { ECPairInterface } from 'ecpair';
import type { Bip32Derivation, TapBip32Derivation } from 'bip174/src/lib/interfaces';
import type { CoinProvider } from './provider';
import type { addrType, CoinInfo, Output, UTXO } from './types';
export interface populateOptions {
    changeAddress?: string;
    customFeePerByte?: number;
    spendAll?: boolean;
    deductFees?: boolean;
    cachedBalance?: CoinBalance;
}
export declare function getInputs(utxos: Array<UTXO>, outputs: Array<Output>, spendAll?: boolean): UTXO[];
export interface CoinTXProperties {
    psbt?: Psbt;
    fees: string;
    inputAmounts: string;
    inputs: Array<UTXO>;
    outputAmounts: string;
    outputs: Array<Output>;
    vBytes: number;
}
export declare class CoinTX {
    psbt?: Psbt;
    fees: string;
    inputAmounts: string;
    inputs: Array<UTXO>;
    outputAmounts: string;
    outputs: Array<Output>;
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
    utxos: Array<UTXO>;
    utxoBalance: number;
    coinbase: number;
}
export declare class CoinBalance {
    feePerByte: number;
    utxos: Array<UTXO>;
    utxoBalance: number;
    coinbase: number;
    constructor(props: CoinBalanceProperties);
}
export interface WalletConfig {
    mnemonic?: string;
    mnemonicIndex?: number;
    publicKey?: string;
    privateKey?: string;
    addrType?: addrType;
    network?: CoinInfo;
}
export declare class CoinWallet {
    provider: CoinProvider;
    addrType: addrType;
    network: CoinInfo;
    address: string;
    publicKey: string;
    privateKey: string;
    privateKeyWithPrefix: string;
    constructor(provider: CoinProvider, config: WalletConfig, generateRandom?: boolean);
    static fromBuffer(provider: CoinProvider, config: WalletConfig, bufferKey: Buffer): CoinWallet;
    getKey(index?: number): ECPairInterface | BIP32Interface | ViewKey;
    getBip32Derivation(index?: number): Array<Bip32Derivation | TapBip32Derivation>;
    getChangeAddress(): string;
    getUtxoAddress(): {
        address: string;
        isPub?: boolean;
    };
    getBalance(): Promise<CoinBalance>;
    getMaxSpendable({ changeAddress, customFeePerByte, cachedBalance, }?: populateOptions): Promise<number>;
    populateTransaction(outputs: Array<Output>, { changeAddress, customFeePerByte, spendAll, deductFees, cachedBalance, }?: populateOptions): Promise<CoinTX>;
    populatePsbt(coinTx: CoinTX): Promise<void>;
    populateConsolidation({ customFeePerByte, cachedBalance, }?: populateOptions): Promise<CoinTX[]>;
    parseTransaction(psbtHex: string): CoinTX;
    signTransaction(psbt: Psbt, keyIndex?: number): Transaction;
    sendTransaction(outputs: Array<Output>, populateOptions?: populateOptions): Promise<CoinTX>;
}
export declare class MnemonicWallet extends CoinWallet {
    mnemonic: string;
    mnemonicIndex: number;
    onlySingle: boolean;
    constructor(provider: CoinProvider, config: WalletConfig, onlySingle?: boolean, generateRandom?: boolean);
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
    getBip32Derivation(index?: number): Array<Bip32Derivation | TapBip32Derivation>;
    signTransaction(psbt: Psbt): Transaction;
}
export interface ViewKey {
    publicKey: Buffer;
    toWIF: () => string;
    tweak: (t: Buffer) => any;
}
export declare class VoidWallet extends CoinWallet {
    constructor(provider: CoinProvider, config: WalletConfig);
    getKey(index?: number): {
        publicKey: Buffer;
        toWIF: () => string;
        tweak: () => void;
    };
}
export default MnemonicWallet;
