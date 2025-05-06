import type { Psbt as btcPsbt } from 'bitcoinjs-lib';
import type { BIP32Interface } from 'bip32';
import type { ECPairInterface } from 'ecpair';
import type { Bip32Derivation, TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { chunk, checkHex } from './utils';
import {
    parseCoins,
    formatCoins,
    getDerivation,
    getBytes,
    getScriptType,
    getAddress,
    getPubBytes,
} from './coinUtils';
import { electrumKeys } from './types';
import { bitcoin } from './factory';
import type { CoinProvider } from './provider';
import type { addrType, CoinInfo, Output, UTXO } from './types';

const {
    Psbt,
    Transaction,
    address: bitcoinAddress,
    payments,
    crypto: bitcoinCrypto,
    networks,

    Buffer,
    bip32,
    bip39,
    bs58check,
    ECPair,
} = bitcoin;

export const RBF_INPUT_SEQUENCE = 0xfffffffd;

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
export function getInputs(utxos: UTXO[], outputs: Output[], spendAll = false) {
    // Throw if the outputs are not specified but this is not a consolidation nor balance calculation
    if (!outputs.length && !spendAll) {
        throw new Error('getInputs: spendAll not specified but no outputs!');
    }

    const outputAmounts = outputs.reduce((acc, output) => {
        acc += output.value;
        return acc;
    }, 0);

    const { inputs } = utxos.reduce(
        (acc, tx) => {
            if (!spendAll && acc.amounts > outputAmounts) {
                return acc;
            }
            acc.amounts += Number(tx.value);
            acc.inputs.push(tx);
            return acc;
        },
        {
            amounts: 0,
            inputs: [],
        } as {
            amounts: number;
            inputs: UTXO[];
        },
    );

    // Prevent the transaction being too big
    // One transaction could only relay 100KB dividing with legacy inputs it could only have 675 maximum
    if (inputs.length + outputs.length > 650) {
        const error = `Selected UTXO is too big (inputs: ${inputs.length}, outputs: ${outputs.length}), make sure to consolidate UTXOs before using it`;
        throw new Error(error);
    }

    return inputs;
}

export interface CoinTXProperties {
    psbt?: btcPsbt;
    fees: string;
    inputAmounts: string;
    inputs: UTXO[];
    outputAmounts: string;
    outputs: Output[];
    vBytes: number;
}

export class CoinTX {
    psbt?: btcPsbt;
    fees: string;
    inputAmounts: string;
    inputs: UTXO[];
    outputAmounts: string;
    outputs: Output[];
    vBytes: number;

    txid?: string;

    constructor(props: CoinTXProperties) {
        this.psbt = props.psbt;
        this.fees = props.fees;
        this.inputAmounts = props.inputAmounts;
        this.inputs = props.inputs;
        this.outputAmounts = props.outputAmounts;
        this.outputs = props.outputs;
        this.vBytes = props.vBytes;
    }

    toJSON() {
        return {
            fees: this.fees,
            inputAmounts: this.inputAmounts,
            inputs: this.inputs,
            outputAmounts: this.outputAmounts,
            outputs: this.outputs.map((output) => ({
                value: output.value,
                address: output.address,
                bytes: output.bytes,
            })),
            vBytes: this.vBytes,
            txid: this.txid,
        };
    }
}

export interface CoinBalanceProperties {
    feePerByte: number;
    utxos: UTXO[];
    utxoBalance: number;
    coinbase: number;
}

export class CoinBalance {
    feePerByte: number;
    utxos: UTXO[];
    utxoBalance: number;
    coinbase: number;

    constructor(props: CoinBalanceProperties) {
        this.feePerByte = props.feePerByte;
        this.utxos = props.utxos;
        this.utxoBalance = props.utxoBalance;
        this.coinbase = props.coinbase;
    }
}

export interface WalletConfig {
    mnemonic?: string;
    mnemonicIndex?: number;
    publicKey?: string;
    privateKey?: string;
    addrType?: addrType;
    network?: CoinInfo;
}

export class CoinWallet {
    provider: CoinProvider;

    addrType: addrType;
    network: CoinInfo;

    address: string;
    publicKey: string;
    privateKey: string;
    privateKeyWithPrefix: string;

    constructor(provider: CoinProvider, config: WalletConfig, generateRandom = true) {
        this.provider = provider;

        // Fallback to default bitcoin mainnet
        this.network = config.network || {
            ...networks.bitcoin,
            versions: {
                bip44: 0,
            },
        };

        // Disable segwit address on non segwit networks like dogecoin
        this.addrType = this.network.bech32 ? config.addrType || 'taproot' : 'legacy';

        const keyPair = config.privateKey
            ? ECPair.fromWIF(config.privateKey, this.network)
            : generateRandom
              ? ECPair.makeRandom({ network: this.network })
              : null;

        const pubKey = Buffer.from(keyPair?.publicKey || []);

        this.address = keyPair ? (getAddress(pubKey, this.addrType, this.network) as string) : '';
        this.publicKey = keyPair ? pubKey.toString('hex') : '';
        this.privateKey = keyPair ? keyPair.toWIF() : '';
        this.privateKeyWithPrefix = keyPair ? `${electrumKeys[this.addrType]}:${this.privateKey}` : '';
    }

    static fromBuffer(provider: CoinProvider, config: WalletConfig, bufferKey: Buffer) {
        const network = config.network || networks.bitcoin;

        const keyPair = ECPair.fromPrivateKey(bufferKey, { network });

        return new CoinWallet(provider, {
            ...config,
            privateKey: keyPair.toWIF(),
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index = 0): ECPairInterface | BIP32Interface | ViewKey {
        if (!this.privateKey) {
            throw new Error('View only wallet or privateKey not available');
        }
        return ECPair.fromWIF(this.privateKey, this.network);
    }

    getKeyInfo(index = 0) {
        const keyPair = this.getKey(index);
        const pubKey = Buffer.from(keyPair?.publicKey || []);

        this.address = getAddress(pubKey, this.addrType, this.network) as string;
        this.publicKey = pubKey.toString('hex');
        this.privateKey = keyPair.toWIF();
        this.privateKeyWithPrefix = `${electrumKeys[this.addrType]}:${this.privateKey}`;

        return {
            keyPair,
            address: getAddress(pubKey, this.addrType, this.network) as string,
            publicKey: pubKey.toString('hex'),
            privateKey: keyPair.toWIF(),
            privateKeyWithPrefix: `${electrumKeys[this.addrType]}:${this.privateKey}`,
        };
    }

    getBip32Derivation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        index = 0,
    ): (Bip32Derivation | TapBip32Derivation)[] {
        return [];
    }

    getChangeAddress() {
        return this.address;
    }

    getUtxoAddress(): { address: string; isPub?: boolean } {
        return {
            address: this.address,
        };
    }

    async getBalance(requiredConfirmations?: number) {
        let coinbase = 0;
        let utxoBalance = 0;

        const provider = this.provider;

        const { address, isPub } = this.getUtxoAddress();

        const [feePerByte, unspents] = await Promise.all([
            provider.estimateFee(),
            provider.getUnspent(address, isPub),
        ]);

        const utxos = unspents.filter((utxo) => {
            if (utxo.coinbase && utxo.confirmations && utxo.confirmations < 100) {
                coinbase += utxo.value;
                return false;
            }

            // Filter unconfirmed utxos or confirmations lower than required ones
            if (
                requiredConfirmations &&
                (!utxo.confirmations || utxo.confirmations < requiredConfirmations)
            ) {
                return false;
            }

            utxoBalance += utxo.value;
            return true;
        });

        return new CoinBalance({
            feePerByte,
            utxos,
            utxoBalance,
            coinbase,
        });
    }

    async getMaxSpendable({ changeAddress, customFeePerByte, cachedBalance }: populateOptions = {}) {
        const { inputAmounts, fees } = await this.populateTransaction([], {
            changeAddress,
            customFeePerByte,
            spendAll: true,
            deductFees: false,
            cachedBalance,
        });

        return parseCoins(inputAmounts) - parseCoins(fees);
    }

    async populateTransaction(
        outputs: Output[],
        {
            changeAddress,
            customFeePerByte,
            spendAll,
            deductFees,
            cachedBalance,
            requiredConfirmations,
        }: populateOptions = {},
    ) {
        const balance = cachedBalance || (await this.getBalance(requiredConfirmations));

        const feePerByte = customFeePerByte || balance.feePerByte;
        const inputs = getInputs(balance.utxos, outputs, spendAll);

        const { addrType, network } = this;

        let inputAmounts = 0;
        let outputAmounts = 0;

        let inputBytes = 0;
        let outputBytes = 0;

        inputs.forEach((input) => {
            inputAmounts += input.value;
            inputBytes += input.bytes = getBytes(addrType);
        });

        outputs.forEach((output) => {
            // Handle OP_RETURN
            if (output.returnData && output.value === 0) {
                const data = checkHex(output.returnData)
                    ? Buffer.from(output.returnData.slice(2), 'hex')
                    : Buffer.from(output.returnData, 'utf8');

                output.script = payments.embed({
                    data: [data],
                }).output;

                outputBytes += output.bytes = data.length + 12;
                return;
            }

            // Special case for consolidation or to estimate fees when max spent
            if (!output?.value) {
                return;
            }

            outputAmounts += output.value;
            outputBytes += output.bytes = getBytes(
                getScriptType(bitcoinAddress.toOutputScript(output.address, network)),
                false,
            );
        });

        let vBytes = 10 + inputBytes + outputBytes;

        let fees = vBytes * feePerByte;

        // Deduct fees from outputs if enabled
        if (deductFees) {
            outputs.forEach((output) => {
                const feePerOutput = Math.ceil(fees / outputs.length);
                output.value -= feePerOutput;
                outputAmounts -= feePerOutput;
            });
        }

        const change = inputAmounts - outputAmounts - fees;
        const changeAddr = changeAddress || this.getChangeAddress();

        // If the user doesn't have enough funds to pay fees cancel the tx
        if (change < 0) {
            const error = `Insufficient amount to cover fees, wants ${formatCoins(outputAmounts + fees)} have ${formatCoins(inputAmounts)}`;
            throw new Error(error);
        }

        if (change > fees && changeAddr) {
            const output = {
                address: changeAddr,
                value: change,
                bytes: getBytes(getScriptType(bitcoinAddress.toOutputScript(changeAddr, network)), false),
            };
            const outputFee = output.bytes * feePerByte;

            // Exclude fee for change output
            output.value -= outputFee;
            fees += outputFee;

            outputAmounts += output.value;
            outputBytes += output.bytes;
            vBytes += output.bytes;

            outputs.push(output);
        }

        return new CoinTX({
            fees: formatCoins(fees),
            inputAmounts: formatCoins(inputAmounts),
            inputs,
            outputAmounts: formatCoins(outputAmounts),
            outputs,
            vBytes,
        });
    }

    async populatePsbt(coinTx: CoinTX) {
        const { inputs, outputs } = coinTx;

        const txs =
            this.addrType === 'legacy'
                ? await this.provider.getTransactions([...new Set(inputs.map((t) => t.txid))])
                : [];

        const { addrType, network } = this;

        const psbt = new Psbt({ network });

        inputs.forEach((input) => {
            const { txid: hash, vout: index, value, address, addressIndex } = input;

            const script = bitcoinAddress.toOutputScript(address || (this.address as string), network);

            const key = this.getKey(addressIndex);
            const pubkey = Buffer.from(key?.publicKey || []);
            const tapInternalKey = pubkey.slice(1, 33);

            const bip32Derivation = this.getBip32Derivation(addressIndex);

            if (addrType === 'taproot') {
                psbt.addInput({
                    hash,
                    index,
                    sequence: RBF_INPUT_SEQUENCE,
                    witnessUtxo: {
                        script,
                        value,
                    },
                    tapInternalKey,
                    tapBip32Derivation: bip32Derivation as TapBip32Derivation[],
                });
            } else if (addrType === 'bech32') {
                psbt.addInput({
                    hash,
                    index,
                    sequence: RBF_INPUT_SEQUENCE,
                    witnessUtxo: {
                        script,
                        value,
                    },
                    bip32Derivation,
                });
            } else if (addrType === 'segwit') {
                const { output: redeemScript } = payments.p2wpkh({
                    pubkey,
                    network,
                });
                psbt.addInput({
                    hash,
                    index,
                    sequence: RBF_INPUT_SEQUENCE,
                    witnessUtxo: {
                        script,
                        value,
                    },
                    redeemScript,
                    bip32Derivation,
                });
            } else {
                const tx = txs.find((t) => t.txid === hash);
                // Skip for simulation (should error when signing phase)
                if (!tx?.hex) {
                    return;
                }
                psbt.addInput({
                    hash,
                    index,
                    sequence: RBF_INPUT_SEQUENCE,
                    nonWitnessUtxo: Buffer.from(tx.hex, 'hex'),
                    bip32Derivation,
                });
            }
        });

        outputs.forEach((output) => {
            // Handle OP_RETURN
            if (output.returnData && output.value === 0) {
                const data = checkHex(output.returnData)
                    ? Buffer.from(output.returnData.slice(2), 'hex')
                    : Buffer.from(output.returnData, 'utf8');

                output.script = payments.embed({
                    data: [data],
                }).output;

                psbt.addOutput(output);
                return;
            }

            // Special case for consolidation or to estimate fees when max spent
            if (!output?.value) {
                return;
            }

            psbt.addOutput(output);
        });

        coinTx.psbt = psbt;
    }

    async populateConsolidation({
        customFeePerByte,
        cachedBalance,
        requiredConfirmations,
    }: populateOptions = {}) {
        const balance = cachedBalance || (await this.getBalance(requiredConfirmations));

        const feePerByte = customFeePerByte || balance.feePerByte;
        const inputs = chunk(balance.utxos, 500);

        return await Promise.all(
            inputs.map(async (input) => {
                const tx = await this.populateTransaction([], {
                    spendAll: true,
                    cachedBalance: new CoinBalance({
                        feePerByte,
                        utxos: input,
                        utxoBalance: input.reduce((acc, curr) => acc + curr.value, 0),
                        coinbase: 0,
                    }),
                });

                await this.populatePsbt(tx);

                return tx;
            }),
        );
    }

    parseTransaction(psbtHex: string) {
        const psbt = Psbt.fromHex(psbtHex, { network: this.network });

        let inputAmounts = 0;
        let outputAmounts = 0;

        const inputBytes = getBytes(this.addrType) * psbt.txInputs.length;
        // Add change address bytes
        let outputBytes = 0;

        const inputs = psbt.txInputs.map((input, index) => {
            const txInput = psbt.data.inputs[index];
            const nonWitnessTx = txInput.nonWitnessUtxo
                ? Transaction.fromBuffer(txInput.nonWitnessUtxo as Buffer, false)
                : undefined;

            const txid = input.hash.toString('hex');
            const vout = input.index;
            const value = (txInput.witnessUtxo?.value || nonWitnessTx?.outs?.[vout]?.value) as number;

            inputAmounts += value;

            return {
                // Height and conf not really necessary for parsed PSBT
                height: NaN,
                confirmations: NaN,
                txid,
                vout,
                value,
                bytes: inputBytes,
            };
        });

        const outputs = psbt.txOutputs.map((output) => {
            let bytes = 0;

            try {
                bytes = getBytes(getScriptType(output.script), false);
                // for some unknown script
            } catch {
                bytes = output.script?.byteLength || 0;
            }

            outputAmounts += output.value;
            outputBytes += bytes;

            return {
                ...output,
                address: output.address as string,
                bytes,
            };
        });

        const vBytes = 10 + inputBytes + outputBytes;
        const fees = inputAmounts - outputAmounts;

        const createdTx = {
            fees: formatCoins(fees),
            inputAmounts: formatCoins(inputAmounts),
            inputs,
            outputAmounts: formatCoins(outputAmounts),
            outputs,
            vBytes,
        };

        return new CoinTX({
            psbt,
            ...createdTx,
        });
    }

    signTransaction(psbt: btcPsbt, keyIndex = 0) {
        const key = this.getKey(keyIndex);
        const pubKey = Buffer.from(key.publicKey);

        // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/taproot.spec.ts
        const tapKey = pubKey.slice(1, 33);
        const tweakedKey = key.tweak(bitcoinCrypto.taggedHash('TapTweak', tapKey));

        psbt.signAllInputs(this.addrType !== 'taproot' ? key : tweakedKey);

        psbt.finalizeAllInputs();

        return psbt.extractTransaction();
    }

    async sendTransaction(outputs: Output[], populateOptions: populateOptions = {}) {
        const coinTx = await this.populateTransaction(outputs, populateOptions);

        await this.populatePsbt(coinTx);

        const signed = this.signTransaction(coinTx.psbt as btcPsbt);

        coinTx.txid = await this.provider.broadcastTransaction(signed.toHex());

        return coinTx;
    }

    async sendConsolidations({
        customFeePerByte,
        cachedBalance,
        requiredConfirmations,
    }: populateOptions = {}) {
        const txs = await this.populateConsolidation({
            customFeePerByte,
            cachedBalance,
            requiredConfirmations,
        });

        for (const tx of txs) {
            const signedTx = this.signTransaction(tx.psbt as btcPsbt);

            tx.txid = await this.provider.broadcastTransaction(signedTx.toHex());
        }

        return txs;
    }
}

export class MnemonicWallet extends CoinWallet {
    mnemonic: string;
    mnemonicIndex: number;
    onlySingle: boolean;

    constructor(provider: CoinProvider, config: WalletConfig, onlySingle = false, generateRandom = true) {
        super(provider, config, false);

        this.mnemonic = config.mnemonic || (generateRandom ? bip39.generateMnemonic(128) : '');
        this.mnemonicIndex = config.mnemonicIndex || 0;

        this.onlySingle = onlySingle;

        this.setKey(this.mnemonicIndex);
    }

    setKey(index = 0) {
        const { address, publicKey, privateKey, privateKeyWithPrefix } = this.getKeyInfo(index);

        this.address = address;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.privateKeyWithPrefix = privateKeyWithPrefix;

        this.mnemonicIndex = index;
    }

    // Get Account Extended Public Key compatible with blockbook instance
    // Can cross-check with https://iancoleman.io/bip39/
    getPub() {
        const root = bip32.fromSeed(bip39.mnemonicToSeedSync(this.mnemonic), this.network);

        const key = root.derivePath(
            `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'`,
        );

        // taproot pubkey is implemented as descriptors
        // https://github.com/satoshilabs/slips/issues/1194
        if (this.addrType === 'taproot') {
            return `tr(${key.neutered().toBase58()})`;
        }

        // https://github.com/bitcoinjs/bitcoinjs-lib/issues/1258
        const data = Buffer.concat([
            Buffer.from(getPubBytes(this.addrType), 'hex'),
            bs58check.decode(key.neutered().toBase58()).slice(4),
        ]);

        return bs58check.encode(data);
    }

    getUtxoAddress() {
        if (this.onlySingle) {
            return {
                address: this.address,
            };
        }

        return {
            address: this.getPub(),
            isPub: true,
        };
    }

    getKey(index = 0) {
        const root = bip32.fromSeed(bip39.mnemonicToSeedSync(this.mnemonic), this.network);

        return root.derivePath(
            `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`,
        );
    }

    getBip32Derivation(index = 0): (Bip32Derivation | TapBip32Derivation)[] {
        if (this.onlySingle) {
            return super.getBip32Derivation(index);
        }

        const root = bip32.fromSeed(bip39.mnemonicToSeedSync(this.mnemonic), this.network);

        const path = `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`;

        const pubkey = root.derivePath(path).publicKey;

        if (this.addrType === 'taproot') {
            return [
                {
                    masterFingerprint: root.fingerprint,
                    path,
                    pubkey: pubkey.slice(1, 33),
                    leafHashes: [],
                },
            ] as TapBip32Derivation[];
        }

        return [
            {
                masterFingerprint: root.fingerprint,
                path,
                pubkey,
            },
        ] as Bip32Derivation[];
    }

    signTransaction(psbt: btcPsbt) {
        if (this.onlySingle) {
            return super.signTransaction(psbt, this.mnemonicIndex);
        }

        const root = bip32.fromSeed(bip39.mnemonicToSeedSync(this.mnemonic), this.network);

        // https://github.com/snapdao/btcsnap/pull/140
        if (this.addrType === 'taproot') {
            psbt.data.inputs.forEach((txInput, index) => {
                const derivation = (txInput.tapBip32Derivation as TapBip32Derivation[])[0];
                const key = root.derivePath(derivation.path);
                const tapKey = key.publicKey.slice(1, 33);
                const tweakedKey = key.tweak(bitcoinCrypto.taggedHash('TapTweak', tapKey));

                psbt.signTaprootInput(index, tweakedKey);
            });
        } else {
            psbt.signAllInputsHD(root);
        }

        psbt.finalizeAllInputs();

        return psbt.extractTransaction();
    }
}

export interface ViewKey {
    publicKey: Buffer;
    toWIF: () => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tweak: (t: Buffer) => any;
}

export class VoidWallet extends CoinWallet {
    constructor(provider: CoinProvider, config: WalletConfig) {
        super(provider, config, false);

        this.publicKey = config.publicKey as string;

        this.address = getAddress(Buffer.from(this.publicKey, 'hex'), this.addrType, this.network) as string;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index = 0) {
        return {
            publicKey: Buffer.from(this.publicKey, 'hex'),
            toWIF: () => '',
            tweak: () => {},
        };
    }
}

export default MnemonicWallet;
