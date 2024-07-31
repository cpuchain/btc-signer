import {
    Psbt,
    Transaction,
    address as bitcoinAddress,
    payments,
    crypto as bitcoinCrypto,
    networks,
} from 'bitcoinjs-lib';
import b58 from 'bs58check';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';

import type { BIP32Interface } from 'bip32';
import type { ECPairInterface } from 'ecpair';
import type {
    Bip32Derivation,
    TapBip32Derivation,
} from 'bip174/src/lib/interfaces';
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
import { bip32, ECPair } from './factory';

import type { CoinProvider } from './provider';
import type { addrType, CoinInfo, Output, UTXO } from './types';

export function getInputs(
    utxos: Array<UTXO>,
    outputs: Array<Output>,
    spendAll: boolean = false,
) {
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
            inputs: Array<UTXO>;
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
    psbt?: Psbt;
    fees: string;
    inputAmounts: string;
    inputs: Array<UTXO>;
    outputAmounts: string;
    outputs: Array<Output>;
    vBytes: number;
}

export class CoinTX {
    psbt?: Psbt;
    fees: string;
    inputAmounts: string;
    inputs: Array<UTXO>;
    outputAmounts: string;
    outputs: Array<Output>;
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
    utxos: Array<UTXO>;
    utxoBalance: number;
    coinbase: number;
}

export class CoinBalance {
    feePerByte: number;
    utxos: Array<UTXO>;
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

    constructor(
        provider: CoinProvider,
        config: WalletConfig,
        generateRandom: boolean = true,
    ) {
        this.provider = provider;

        // Fallback to default bitcoin mainnet
        this.network = config.network || {
            ...networks.bitcoin,
            versions: {
                bip44: 0,
            },
        };

        // Disable segwit address on non segwit networks like dogecoin
        this.addrType = this.network.bech32
            ? config.addrType || 'taproot'
            : 'legacy';

        const keyPair = config.privateKey
            ? ECPair.fromWIF(config.privateKey, this.network)
            : generateRandom
              ? ECPair.makeRandom({ network: this.network })
              : null;

        this.address = keyPair
            ? (getAddress(
                  keyPair.publicKey,
                  this.addrType,
                  this.network,
              ) as string)
            : '';
        this.publicKey = keyPair ? keyPair.publicKey.toString('hex') : '';
        this.privateKey = keyPair ? keyPair.toWIF() : '';
        this.privateKeyWithPrefix = keyPair
            ? `${electrumKeys[this.addrType]}:${this.privateKey}`
            : '';
    }

    static fromBuffer(
        provider: CoinProvider,
        config: WalletConfig,
        bufferKey: Buffer,
    ) {
        const network = config.network || networks.bitcoin;

        const keyPair = ECPair.fromPrivateKey(bufferKey, { network });

        return new CoinWallet(provider, {
            ...config,
            privateKey: keyPair.toWIF(),
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index: number = 0): ECPairInterface | BIP32Interface | ViewKey {
        if (!this.privateKey) {
            throw new Error('View only wallet or privateKey not available');
        }
        return ECPair.fromWIF(this.privateKey, this.network);
    }

    getBip32Derivation(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        index: number = 0,
    ): Array<Bip32Derivation | TapBip32Derivation> {
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

    async getBalance() {
        let coinbase = 0;
        let utxoBalance = 0;

        const provider = this.provider;

        const { address, isPub } = this.getUtxoAddress();

        const [feePerByte, unspents] = await Promise.all([
            provider.estimateFee(),
            provider.getUnspent(address, isPub),
        ]);

        const utxos = unspents.filter((utxo) => {
            if (
                utxo.coinbase &&
                utxo.confirmations &&
                utxo.confirmations < 100
            ) {
                coinbase += utxo.value;
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

    async getMaxSpendable(
        changeAddress?: string,
        customFeePerByte?: number,
        cachedBalance?: CoinBalance,
    ) {
        const { inputAmounts, fees } = await this.populateTransaction(
            [],
            changeAddress,
            customFeePerByte,
            true,
            cachedBalance,
        );

        return parseCoins(inputAmounts) - parseCoins(fees);
    }

    async populateTransaction(
        outputs: Array<Output>,
        changeAddress?: string,
        customFeePerByte?: number,
        spendAll?: boolean,
        cachedBalance?: CoinBalance,
    ) {
        const balance = cachedBalance || (await this.getBalance());

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
                getScriptType(
                    bitcoinAddress.toOutputScript(output.address, network),
                ),
                false,
            );
        });

        let vBytes = 10 + inputBytes + outputBytes;

        let fees = vBytes * feePerByte;

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
                bytes: getBytes(
                    getScriptType(
                        bitcoinAddress.toOutputScript(changeAddr, network),
                    ),
                    false,
                ),
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
                ? await this.provider.getTransactions([
                      ...new Set(inputs.map((t) => t.txid)),
                  ])
                : [];

        const { addrType, network } = this;

        const psbt = new Psbt({ network });

        inputs.forEach((input) => {
            const {
                txid: hash,
                vout: index,
                value,
                address,
                addressIndex,
            } = input;

            const script = bitcoinAddress.toOutputScript(
                address || (this.address as string),
                network,
            );

            const key = this.getKey(addressIndex);
            const tapInternalKey = key.publicKey.slice(1, 33);

            const bip32Derivation = this.getBip32Derivation(addressIndex);

            if (addrType === 'taproot') {
                psbt.addInput({
                    hash,
                    index,
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
                    witnessUtxo: {
                        script,
                        value,
                    },
                    bip32Derivation,
                });
            } else if (addrType === 'segwit') {
                const { output: redeemScript } = payments.p2wpkh({
                    pubkey: key.publicKey,
                    network,
                });
                psbt.addInput({
                    hash,
                    index,
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

    async populateConsolidation(
        customFeePerByte?: number,
        cachedBalance?: CoinBalance,
    ) {
        const balance = cachedBalance || (await this.getBalance());

        const feePerByte = customFeePerByte || balance.feePerByte;
        const inputs = chunk(balance.utxos, 500);

        return await Promise.all(
            inputs.map(async (input) => {
                const tx = await this.populateTransaction(
                    [],
                    undefined,
                    undefined,
                    true,
                    new CoinBalance({
                        feePerByte,
                        utxos: input,
                        utxoBalance: input.reduce(
                            (acc, curr) => acc + curr.value,
                            0,
                        ),
                        coinbase: 0,
                    }),
                );

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
                ? Transaction.fromBuffer(
                      txInput.nonWitnessUtxo as Buffer,
                      false,
                  )
                : undefined;

            const txid = input.hash.toString('hex');
            const vout = input.index;
            const value = (txInput.witnessUtxo?.value ||
                nonWitnessTx?.outs?.[vout]?.value) as number;

            inputAmounts += value;

            return {
                txid,
                vout,
                value,
                bytes: inputBytes,
            };
        });

        const outputs = psbt.txOutputs.map((output) => {
            const bytes = getBytes(getScriptType(output.script), false);

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

    signTransaction(psbt: Psbt, keyIndex: number = 0) {
        const key = this.getKey(keyIndex);

        // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/taproot.spec.ts
        const tapKey = key.publicKey.slice(1, 33);
        const tweakedKey = key.tweak(
            bitcoinCrypto.taggedHash('TapTweak', tapKey),
        );

        psbt.signAllInputs(this.addrType !== 'taproot' ? key : tweakedKey);

        psbt.finalizeAllInputs();

        return psbt.extractTransaction();
    }

    async sendTransaction(
        outputs: Array<Output>,
        changeAddress?: string,
        customFeePerByte?: number,
        spendAll?: boolean,
        cachedBalance?: CoinBalance,
    ) {
        const coinTx = await this.populateTransaction(
            outputs,
            changeAddress,
            customFeePerByte,
            spendAll,
            cachedBalance,
        );

        await this.populatePsbt(coinTx);

        const signed = this.signTransaction(coinTx.psbt as Psbt);

        coinTx.txid = await this.provider.broadcastTransaction(signed.toHex());

        return coinTx;
    }
}

export class MnemonicWallet extends CoinWallet {
    mnemonic: string;
    mnemonicIndex: number;
    onlySingle: boolean;

    constructor(
        provider: CoinProvider,
        config: WalletConfig,
        onlySingle: boolean = false,
        generateRandom: boolean = true,
    ) {
        super(provider, config, false);

        this.mnemonic =
            config.mnemonic || (generateRandom ? generateMnemonic(128) : '');
        this.mnemonicIndex = config.mnemonicIndex || 0;

        this.onlySingle = onlySingle;

        this.setKey(this.mnemonicIndex);
    }

    setKey(index: number = 0) {
        const keyPair = this.getKey(index);

        this.address = getAddress(
            keyPair.publicKey,
            this.addrType,
            this.network,
        ) as string;
        this.publicKey = keyPair.publicKey.toString('hex');
        this.privateKey = keyPair.toWIF();
        this.privateKeyWithPrefix = `${electrumKeys[this.addrType]}:${this.privateKey}`;

        this.mnemonicIndex = index;
    }

    // Get Account Extended Public Key compatible with blockbook instance
    // Can cross-check with https://iancoleman.io/bip39/
    getPub() {
        const root = bip32.fromSeed(
            mnemonicToSeedSync(this.mnemonic),
            this.network,
        );

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
            b58.decode(key.neutered().toBase58()).slice(4),
        ]);

        return b58.encode(data);
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

    getKey(index: number = 0) {
        const root = bip32.fromSeed(
            mnemonicToSeedSync(this.mnemonic),
            this.network,
        );

        return root.derivePath(
            `m/${getDerivation(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`,
        );
    }

    getBip32Derivation(
        index: number = 0,
    ): Array<Bip32Derivation | TapBip32Derivation> {
        if (this.onlySingle) {
            return super.getBip32Derivation(index);
        }

        const root = bip32.fromSeed(
            mnemonicToSeedSync(this.mnemonic),
            this.network,
        );

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

    signTransaction(psbt: Psbt) {
        if (this.onlySingle) {
            return super.signTransaction(psbt, this.mnemonicIndex);
        }

        const root = bip32.fromSeed(
            mnemonicToSeedSync(this.mnemonic),
            this.network,
        );

        // https://github.com/snapdao/btcsnap/pull/140
        if (this.addrType === 'taproot') {
            psbt.data.inputs.forEach((txInput, index) => {
                const derivation = (
                    txInput.tapBip32Derivation as TapBip32Derivation[]
                )[0];
                const key = root.derivePath(derivation.path);
                const tapKey = key.publicKey.slice(1, 33);
                const tweakedKey = key.tweak(
                    bitcoinCrypto.taggedHash('TapTweak', tapKey),
                );

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

        this.address = getAddress(
            Buffer.from(this.publicKey, 'hex'),
            this.addrType,
            this.network,
        ) as string;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index: number = 0) {
        return {
            publicKey: Buffer.from(this.publicKey, 'hex'),
            toWIF: () => '',
            tweak: () => {},
        };
    }
}

export default MnemonicWallet;
