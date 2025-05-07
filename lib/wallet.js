"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidWallet = exports.MnemonicWallet = exports.CoinWallet = exports.CoinBalance = exports.CoinTX = exports.DEFAULT_FEE_MULTIPLIER = exports.RBF_INPUT_SEQUENCE = void 0;
exports.getInputs = getInputs;
const utils_1 = require("./utils");
const coinUtils_1 = require("./coinUtils");
const types_1 = require("./types");
const factory_1 = require("./factory");
const provider_1 = require("./provider");
const { Psbt: btcPsbt, Transaction, address: bitcoinAddress, payments, crypto: bitcoinCrypto, networks, Buffer, bip32, bip39, bs58check, ECPair, } = factory_1.bitcoin;
exports.RBF_INPUT_SEQUENCE = 0xfffffffd;
exports.DEFAULT_FEE_MULTIPLIER = 2;
/**
 * Select UTXO inputs based on desired outputs
 */
function getInputs(utxos, outputs, spendAll = false) {
    // Throw if the outputs are not specified but this is not a consolidation nor balance calculation
    if (!outputs.length && !spendAll) {
        throw new Error('getInputs: spendAll not specified but no outputs!');
    }
    const outputAmounts = outputs.reduce((acc, output) => {
        acc += output.value;
        return acc;
    }, 0);
    const { inputs } = utxos.reduce((acc, tx) => {
        if (!spendAll && acc.amounts > outputAmounts) {
            return acc;
        }
        acc.amounts += Number(tx.value);
        acc.inputs.push(tx);
        return acc;
    }, {
        amounts: 0,
        inputs: [],
    });
    // Prevent the transaction being too big
    // One transaction could only relay 100KB dividing with legacy inputs it could only have 675 maximum
    if (inputs.length + outputs.length > 650) {
        const error = `Selected UTXO is too big (inputs: ${inputs.length}, outputs: ${outputs.length}), make sure to consolidate UTXOs before using it`;
        throw new Error(error);
    }
    return inputs;
}
class CoinTX {
    psbt;
    fees;
    inputAmounts;
    inputs;
    outputAmounts;
    outputs;
    vBytes;
    txid;
    constructor(props) {
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
exports.CoinTX = CoinTX;
class CoinBalance {
    feePerByte;
    utxos;
    utxoBalance;
    coinbase;
    constructor(props) {
        this.feePerByte = props.feePerByte;
        this.utxos = props.utxos;
        this.utxoBalance = props.utxoBalance;
        this.coinbase = props.coinbase;
    }
}
exports.CoinBalance = CoinBalance;
class CoinWallet {
    provider;
    addrType;
    network;
    address;
    publicKey;
    privateKey;
    privateKeyWithPrefix;
    feeMultiplier;
    constructor(privateKey, provider, options) {
        const generateRandom = options?.generateRandom ?? true;
        this.provider = provider;
        // Fallback to default bitcoin mainnet
        this.network = options?.network || {
            ...networks.bitcoin,
            versions: {
                bip44: 0,
            },
        };
        // Disable segwit address on non segwit networks like dogecoin
        this.addrType = this.network.bech32 ? options?.addrType || 'taproot' : 'legacy';
        const keyPair = privateKey
            ? ECPair.fromWIF(privateKey, this.network)
            : generateRandom
                ? ECPair.makeRandom({ network: this.network })
                : null;
        const pubKey = Buffer.from(keyPair?.publicKey || []);
        this.address = keyPair ? (0, coinUtils_1.getAddress)(pubKey, this.addrType, this.network) : '';
        this.publicKey = keyPair ? pubKey.toString('hex') : '';
        this.privateKey = keyPair ? keyPair.toWIF() : undefined;
        this.privateKeyWithPrefix = keyPair ? `${types_1.electrumKeys[this.addrType]}:${this.privateKey}` : undefined;
        this.feeMultiplier = options?.feeMultiplier;
    }
    static fromBuffer(bufferKey, provider, options) {
        const keyPair = ECPair.fromPrivateKey(bufferKey, {
            network: options?.network || networks.bitcoin,
        });
        return new CoinWallet(keyPair.toWIF(), provider, options);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index = 0) {
        if (!this.privateKey) {
            throw new Error('View only wallet or privateKey not available');
        }
        return ECPair.fromWIF(this.privateKey, this.network);
    }
    getKeyInfo(index = 0) {
        const keyPair = this.getKey(index);
        const pubKey = Buffer.from(keyPair?.publicKey || []);
        this.address = (0, coinUtils_1.getAddress)(pubKey, this.addrType, this.network);
        this.publicKey = pubKey.toString('hex');
        this.privateKey = keyPair.toWIF();
        this.privateKeyWithPrefix = `${types_1.electrumKeys[this.addrType]}:${this.privateKey}`;
        return {
            keyPair,
            address: (0, coinUtils_1.getAddress)(pubKey, this.addrType, this.network),
            publicKey: pubKey.toString('hex'),
            privateKey: keyPair.toWIF(),
            privateKeyWithPrefix: `${types_1.electrumKeys[this.addrType]}:${this.privateKey}`,
        };
    }
    getBip32Derivation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index = 0) {
        return [];
    }
    getChangeAddress() {
        return this.address;
    }
    getUtxoAddress() {
        return {
            address: this.address,
        };
    }
    async getBalance(requiredConfirmations) {
        let coinbase = 0;
        let utxoBalance = 0;
        const provider = this.provider;
        const { address, isPub } = this.getUtxoAddress();
        const [feeMultiplier, estimatedFee, unspents] = await Promise.all([
            this.feeMultiplier?.(),
            provider.estimateFee(),
            provider.getUnspent(address, isPub),
        ]);
        const feePerByte = Math.floor(estimatedFee * (feeMultiplier || exports.DEFAULT_FEE_MULTIPLIER));
        const utxos = unspents.filter((utxo) => {
            if (utxo.coinbase && utxo.confirmations && utxo.confirmations < 100) {
                coinbase += utxo.value;
                return false;
            }
            // Filter unconfirmed utxos or confirmations lower than required ones
            if (requiredConfirmations &&
                (!utxo.confirmations || utxo.confirmations < requiredConfirmations)) {
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
    async getMaxSpendable({ changeAddress, customFeePerByte, cachedBalance } = {}) {
        const { inputAmounts, fees } = await this.populateTransaction([], {
            changeAddress,
            customFeePerByte,
            spendAll: true,
            deductFees: false,
            cachedBalance,
        });
        return (0, coinUtils_1.parseCoins)(inputAmounts) - (0, coinUtils_1.parseCoins)(fees);
    }
    async populateTransaction(outputs, { changeAddress, customFeePerByte, spendAll, deductFees, cachedBalance, requiredConfirmations, } = {}) {
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
            inputBytes += input.bytes = (0, coinUtils_1.getBytes)(addrType);
        });
        outputs.forEach((output) => {
            // Handle OP_RETURN
            if (output.returnData && output.value === 0) {
                const data = (0, utils_1.checkHex)(output.returnData)
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
            outputBytes += output.bytes = (0, coinUtils_1.getBytes)((0, coinUtils_1.getScriptType)(bitcoinAddress.toOutputScript(output.address, network)), false);
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
            const error = `Insufficient amount to cover fees, wants ${(0, coinUtils_1.formatCoins)(outputAmounts + fees)} have ${(0, coinUtils_1.formatCoins)(inputAmounts)}`;
            throw new Error(error);
        }
        if (change > fees && changeAddr) {
            const output = {
                address: changeAddr,
                value: change,
                bytes: (0, coinUtils_1.getBytes)((0, coinUtils_1.getScriptType)(bitcoinAddress.toOutputScript(changeAddr, network)), false),
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
            fees: (0, coinUtils_1.formatCoins)(fees),
            inputAmounts: (0, coinUtils_1.formatCoins)(inputAmounts),
            inputs,
            outputAmounts: (0, coinUtils_1.formatCoins)(outputAmounts),
            outputs,
            vBytes,
        });
    }
    async populatePsbt(coinTx) {
        const { inputs, outputs } = coinTx;
        const txs = this.addrType === 'legacy'
            ? await this.provider.getTransactions([...new Set(inputs.map((t) => t.txid))])
            : [];
        const { addrType, network } = this;
        const psbt = new btcPsbt({ network });
        inputs.forEach((input) => {
            const { txid: hash, vout: index, value, address, addressIndex } = input;
            const script = bitcoinAddress.toOutputScript(address || this.address, network);
            const key = this.getKey(addressIndex);
            const pubkey = Buffer.from(key?.publicKey || []);
            const tapInternalKey = pubkey.slice(1, 33);
            const bip32Derivation = this.getBip32Derivation(addressIndex);
            if (addrType === 'taproot') {
                psbt.addInput({
                    hash,
                    index,
                    sequence: exports.RBF_INPUT_SEQUENCE,
                    witnessUtxo: {
                        script,
                        value,
                    },
                    tapInternalKey,
                    tapBip32Derivation: bip32Derivation,
                });
            }
            else if (addrType === 'bech32') {
                psbt.addInput({
                    hash,
                    index,
                    sequence: exports.RBF_INPUT_SEQUENCE,
                    witnessUtxo: {
                        script,
                        value,
                    },
                    bip32Derivation,
                });
            }
            else if (addrType === 'segwit') {
                const { output: redeemScript } = payments.p2wpkh({
                    pubkey,
                    network,
                });
                psbt.addInput({
                    hash,
                    index,
                    sequence: exports.RBF_INPUT_SEQUENCE,
                    witnessUtxo: {
                        script,
                        value,
                    },
                    redeemScript,
                    bip32Derivation,
                });
            }
            else {
                const tx = txs.find((t) => t.txid === hash);
                // Skip for simulation (should error when signing phase)
                if (!tx?.hex) {
                    return;
                }
                psbt.addInput({
                    hash,
                    index,
                    sequence: exports.RBF_INPUT_SEQUENCE,
                    nonWitnessUtxo: Buffer.from(tx.hex, 'hex'),
                    bip32Derivation,
                });
            }
        });
        outputs.forEach((output) => {
            // Handle OP_RETURN
            if (output.returnData && output.value === 0) {
                const data = (0, utils_1.checkHex)(output.returnData)
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
    async populateConsolidation({ customFeePerByte, cachedBalance, requiredConfirmations, } = {}) {
        const balance = cachedBalance || (await this.getBalance(requiredConfirmations));
        const feePerByte = customFeePerByte || balance.feePerByte;
        const inputs = (0, utils_1.chunk)(balance.utxos, 500);
        return await Promise.all(inputs.map(async (input) => {
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
        }));
    }
    parseTransaction(psbtHex) {
        const psbt = btcPsbt.fromHex(psbtHex, { network: this.network });
        let inputAmounts = 0;
        let outputAmounts = 0;
        const inputBytes = (0, coinUtils_1.getBytes)(this.addrType) * psbt.txInputs.length;
        // Add change address bytes
        let outputBytes = 0;
        const inputs = psbt.txInputs.map((input, index) => {
            const txInput = psbt.data.inputs[index];
            const nonWitnessTx = txInput.nonWitnessUtxo
                ? Transaction.fromBuffer(txInput.nonWitnessUtxo, false)
                : undefined;
            const txid = input.hash.toString('hex');
            const vout = input.index;
            const value = (txInput.witnessUtxo?.value || nonWitnessTx?.outs?.[vout]?.value);
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
                bytes = (0, coinUtils_1.getBytes)((0, coinUtils_1.getScriptType)(output.script), false);
                // for some unknown script
            }
            catch {
                bytes = output.script?.byteLength || 0;
            }
            outputAmounts += output.value;
            outputBytes += bytes;
            return {
                ...output,
                address: output.address,
                bytes,
            };
        });
        const vBytes = 10 + inputBytes + outputBytes;
        const fees = inputAmounts - outputAmounts;
        const createdTx = {
            fees: (0, coinUtils_1.formatCoins)(fees),
            inputAmounts: (0, coinUtils_1.formatCoins)(inputAmounts),
            inputs,
            outputAmounts: (0, coinUtils_1.formatCoins)(outputAmounts),
            outputs,
            vBytes,
        };
        return new CoinTX({
            psbt,
            ...createdTx,
        });
    }
    signTransaction(psbt, keyIndex = 0) {
        const key = this.getKey(keyIndex);
        const pubKey = Buffer.from(key.publicKey);
        // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/taproot.spec.ts
        const tapKey = pubKey.slice(1, 33);
        const tweakedKey = key.tweak(bitcoinCrypto.taggedHash('TapTweak', tapKey));
        psbt.signAllInputs(this.addrType !== 'taproot' ? key : tweakedKey);
        psbt.finalizeAllInputs();
        return psbt.extractTransaction();
    }
    async sendTransaction(outputs, populateOptions = {}) {
        const coinTx = await this.populateTransaction(outputs, populateOptions);
        await this.populatePsbt(coinTx);
        const signed = this.signTransaction(coinTx.psbt);
        coinTx.txid = await this.provider.broadcastTransaction(signed.toHex());
        return coinTx;
    }
    async sendConsolidations({ customFeePerByte, cachedBalance, requiredConfirmations, } = {}) {
        const txs = await this.populateConsolidation({
            customFeePerByte,
            cachedBalance,
            requiredConfirmations,
        });
        for (const tx of txs) {
            const signedTx = this.signTransaction(tx.psbt);
            tx.txid = await this.provider.broadcastTransaction(signedTx.toHex());
        }
        return txs;
    }
}
exports.CoinWallet = CoinWallet;
class MnemonicWallet extends CoinWallet {
    mnemonic;
    mnemonicIndex;
    onlySingle;
    constructor(mnemonic, provider, options) {
        super(undefined, provider, {
            ...options,
            generateRandom: false,
        });
        const generateRandom = options?.generateRandom ?? true;
        this.mnemonic = mnemonic || (generateRandom ? bip39.generateMnemonic(128) : '');
        this.mnemonicIndex = options?.mnemonicIndex ?? 0;
        this.onlySingle = options?.onlySingle ?? (provider instanceof provider_1.MempoolProvider ? true : false);
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
        const key = root.derivePath(`m/${(0, coinUtils_1.getDerivation)(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'`);
        // taproot pubkey is implemented as descriptors
        // https://github.com/satoshilabs/slips/issues/1194
        if (this.addrType === 'taproot') {
            return `tr(${key.neutered().toBase58()})`;
        }
        // https://github.com/bitcoinjs/bitcoinjs-lib/issues/1258
        const data = Buffer.concat([
            Buffer.from((0, coinUtils_1.getPubBytes)(this.addrType), 'hex'),
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
        return root.derivePath(`m/${(0, coinUtils_1.getDerivation)(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`);
    }
    getBip32Derivation(index = 0) {
        if (this.onlySingle) {
            return super.getBip32Derivation(index);
        }
        const root = bip32.fromSeed(bip39.mnemonicToSeedSync(this.mnemonic), this.network);
        const path = `m/${(0, coinUtils_1.getDerivation)(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`;
        const pubkey = root.derivePath(path).publicKey;
        if (this.addrType === 'taproot') {
            return [
                {
                    masterFingerprint: root.fingerprint,
                    path,
                    pubkey: pubkey.slice(1, 33),
                    leafHashes: [],
                },
            ];
        }
        return [
            {
                masterFingerprint: root.fingerprint,
                path,
                pubkey,
            },
        ];
    }
    signTransaction(psbt) {
        if (this.onlySingle) {
            return super.signTransaction(psbt, this.mnemonicIndex);
        }
        const root = bip32.fromSeed(bip39.mnemonicToSeedSync(this.mnemonic), this.network);
        // https://github.com/snapdao/btcsnap/pull/140
        if (this.addrType === 'taproot') {
            psbt.data.inputs.forEach((txInput, index) => {
                const derivation = txInput.tapBip32Derivation[0];
                const key = root.derivePath(derivation.path);
                const tapKey = key.publicKey.slice(1, 33);
                const tweakedKey = key.tweak(bitcoinCrypto.taggedHash('TapTweak', tapKey));
                psbt.signTaprootInput(index, tweakedKey);
            });
        }
        else {
            psbt.signAllInputsHD(root);
        }
        psbt.finalizeAllInputs();
        return psbt.extractTransaction();
    }
}
exports.MnemonicWallet = MnemonicWallet;
class VoidWallet extends CoinWallet {
    constructor(publicKey, provider, options) {
        super(undefined, provider, {
            ...options,
            generateRandom: false,
        });
        this.publicKey = publicKey;
        this.address = (0, coinUtils_1.getAddress)(Buffer.from(this.publicKey, 'hex'), this.addrType, this.network);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index = 0) {
        return {
            publicKey: Buffer.from(this.publicKey, 'hex'),
            toWIF: () => '',
            tweak: () => { },
        };
    }
}
exports.VoidWallet = VoidWallet;
