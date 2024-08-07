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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidWallet = exports.MnemonicWallet = exports.CoinWallet = exports.CoinBalance = exports.CoinTX = void 0;
exports.getInputs = getInputs;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bs58check_1 = __importDefault(require("bs58check"));
const bip39_1 = require("bip39");
const utils_1 = require("./utils");
const coinUtils_1 = require("./coinUtils");
const types_1 = require("./types");
const factory_1 = require("./factory");
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
    constructor(props) {
        this.feePerByte = props.feePerByte;
        this.utxos = props.utxos;
        this.utxoBalance = props.utxoBalance;
        this.coinbase = props.coinbase;
    }
}
exports.CoinBalance = CoinBalance;
class CoinWallet {
    constructor(provider, config, generateRandom = true) {
        this.provider = provider;
        // Fallback to default bitcoin mainnet
        this.network = config.network || Object.assign(Object.assign({}, bitcoinjs_lib_1.networks.bitcoin), { versions: {
                bip44: 0,
            } });
        // Disable segwit address on non segwit networks like dogecoin
        this.addrType = this.network.bech32
            ? config.addrType || 'taproot'
            : 'legacy';
        const keyPair = config.privateKey
            ? factory_1.ECPair.fromWIF(config.privateKey, this.network)
            : generateRandom
                ? factory_1.ECPair.makeRandom({ network: this.network })
                : null;
        this.address = keyPair
            ? (0, coinUtils_1.getAddress)(keyPair.publicKey, this.addrType, this.network)
            : '';
        this.publicKey = keyPair ? keyPair.publicKey.toString('hex') : '';
        this.privateKey = keyPair ? keyPair.toWIF() : '';
        this.privateKeyWithPrefix = keyPair
            ? `${types_1.electrumKeys[this.addrType]}:${this.privateKey}`
            : '';
    }
    static fromBuffer(provider, config, bufferKey) {
        const network = config.network || bitcoinjs_lib_1.networks.bitcoin;
        const keyPair = factory_1.ECPair.fromPrivateKey(bufferKey, { network });
        return new CoinWallet(provider, Object.assign(Object.assign({}, config), { privateKey: keyPair.toWIF() }));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getKey(index = 0) {
        if (!this.privateKey) {
            throw new Error('View only wallet or privateKey not available');
        }
        return factory_1.ECPair.fromWIF(this.privateKey, this.network);
    }
    getKeyInfo(index = 0) {
        const keyPair = this.getKey(index);
        this.address = (0, coinUtils_1.getAddress)(keyPair.publicKey, this.addrType, this.network);
        this.publicKey = keyPair.publicKey.toString('hex');
        this.privateKey = keyPair.toWIF();
        this.privateKeyWithPrefix = `${types_1.electrumKeys[this.addrType]}:${this.privateKey}`;
        return {
            keyPair,
            address: (0, coinUtils_1.getAddress)(keyPair.publicKey, this.addrType, this.network),
            publicKey: keyPair.publicKey.toString('hex'),
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
    getBalance(requiredConfirmations) {
        return __awaiter(this, void 0, void 0, function* () {
            let coinbase = 0;
            let utxoBalance = 0;
            const provider = this.provider;
            const { address, isPub } = this.getUtxoAddress();
            const [feePerByte, unspents] = yield Promise.all([
                provider.estimateFee(),
                provider.getUnspent(address, isPub),
            ]);
            const utxos = unspents.filter((utxo) => {
                if (utxo.coinbase &&
                    utxo.confirmations &&
                    utxo.confirmations < 100) {
                    coinbase += utxo.value;
                    return false;
                }
                // Filter unconfirmed utxos or confirmations lower than required ones
                if (requiredConfirmations &&
                    (!utxo.confirmations ||
                        utxo.confirmations < requiredConfirmations)) {
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
        });
    }
    getMaxSpendable() {
        return __awaiter(this, arguments, void 0, function* ({ changeAddress, customFeePerByte, cachedBalance, } = {}) {
            const { inputAmounts, fees } = yield this.populateTransaction([], {
                changeAddress,
                customFeePerByte,
                spendAll: true,
                deductFees: false,
                cachedBalance,
            });
            return (0, coinUtils_1.parseCoins)(inputAmounts) - (0, coinUtils_1.parseCoins)(fees);
        });
    }
    populateTransaction(outputs_1) {
        return __awaiter(this, arguments, void 0, function* (outputs, { changeAddress, customFeePerByte, spendAll, deductFees, cachedBalance, requiredConfirmations, } = {}) {
            const balance = cachedBalance || (yield this.getBalance(requiredConfirmations));
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
                    output.script = bitcoinjs_lib_1.payments.embed({
                        data: [data],
                    }).output;
                    outputBytes += output.bytes = data.length + 12;
                    return;
                }
                // Special case for consolidation or to estimate fees when max spent
                if (!(output === null || output === void 0 ? void 0 : output.value)) {
                    return;
                }
                outputAmounts += output.value;
                outputBytes += output.bytes = (0, coinUtils_1.getBytes)((0, coinUtils_1.getScriptType)(bitcoinjs_lib_1.address.toOutputScript(output.address, network)), false);
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
                    bytes: (0, coinUtils_1.getBytes)((0, coinUtils_1.getScriptType)(bitcoinjs_lib_1.address.toOutputScript(changeAddr, network)), false),
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
        });
    }
    populatePsbt(coinTx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { inputs, outputs } = coinTx;
            const txs = this.addrType === 'legacy'
                ? yield this.provider.getTransactions([
                    ...new Set(inputs.map((t) => t.txid)),
                ])
                : [];
            const { addrType, network } = this;
            const psbt = new bitcoinjs_lib_1.Psbt({ network });
            inputs.forEach((input) => {
                const { txid: hash, vout: index, value, address, addressIndex, } = input;
                const script = bitcoinjs_lib_1.address.toOutputScript(address || this.address, network);
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
                        tapBip32Derivation: bip32Derivation,
                    });
                }
                else if (addrType === 'bech32') {
                    psbt.addInput({
                        hash,
                        index,
                        witnessUtxo: {
                            script,
                            value,
                        },
                        bip32Derivation,
                    });
                }
                else if (addrType === 'segwit') {
                    const { output: redeemScript } = bitcoinjs_lib_1.payments.p2wpkh({
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
                }
                else {
                    const tx = txs.find((t) => t.txid === hash);
                    // Skip for simulation (should error when signing phase)
                    if (!(tx === null || tx === void 0 ? void 0 : tx.hex)) {
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
                    const data = (0, utils_1.checkHex)(output.returnData)
                        ? Buffer.from(output.returnData.slice(2), 'hex')
                        : Buffer.from(output.returnData, 'utf8');
                    output.script = bitcoinjs_lib_1.payments.embed({
                        data: [data],
                    }).output;
                    psbt.addOutput(output);
                    return;
                }
                // Special case for consolidation or to estimate fees when max spent
                if (!(output === null || output === void 0 ? void 0 : output.value)) {
                    return;
                }
                psbt.addOutput(output);
            });
            coinTx.psbt = psbt;
        });
    }
    populateConsolidation() {
        return __awaiter(this, arguments, void 0, function* ({ customFeePerByte, cachedBalance, requiredConfirmations, } = {}) {
            const balance = cachedBalance || (yield this.getBalance(requiredConfirmations));
            const feePerByte = customFeePerByte || balance.feePerByte;
            const inputs = (0, utils_1.chunk)(balance.utxos, 500);
            return yield Promise.all(inputs.map((input) => __awaiter(this, void 0, void 0, function* () {
                const tx = yield this.populateTransaction([], {
                    spendAll: true,
                    cachedBalance: new CoinBalance({
                        feePerByte,
                        utxos: input,
                        utxoBalance: input.reduce((acc, curr) => acc + curr.value, 0),
                        coinbase: 0,
                    }),
                });
                yield this.populatePsbt(tx);
                return tx;
            })));
        });
    }
    parseTransaction(psbtHex) {
        const psbt = bitcoinjs_lib_1.Psbt.fromHex(psbtHex, { network: this.network });
        let inputAmounts = 0;
        let outputAmounts = 0;
        const inputBytes = (0, coinUtils_1.getBytes)(this.addrType) * psbt.txInputs.length;
        // Add change address bytes
        let outputBytes = 0;
        const inputs = psbt.txInputs.map((input, index) => {
            var _a, _b, _c;
            const txInput = psbt.data.inputs[index];
            const nonWitnessTx = txInput.nonWitnessUtxo
                ? bitcoinjs_lib_1.Transaction.fromBuffer(txInput.nonWitnessUtxo, false)
                : undefined;
            const txid = input.hash.toString('hex');
            const vout = input.index;
            const value = (((_a = txInput.witnessUtxo) === null || _a === void 0 ? void 0 : _a.value) ||
                ((_c = (_b = nonWitnessTx === null || nonWitnessTx === void 0 ? void 0 : nonWitnessTx.outs) === null || _b === void 0 ? void 0 : _b[vout]) === null || _c === void 0 ? void 0 : _c.value));
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
            const bytes = (0, coinUtils_1.getBytes)((0, coinUtils_1.getScriptType)(output.script), false);
            outputAmounts += output.value;
            outputBytes += bytes;
            return Object.assign(Object.assign({}, output), { address: output.address, bytes });
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
        return new CoinTX(Object.assign({ psbt }, createdTx));
    }
    signTransaction(psbt, keyIndex = 0) {
        const key = this.getKey(keyIndex);
        // https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/taproot.spec.ts
        const tapKey = key.publicKey.slice(1, 33);
        const tweakedKey = key.tweak(bitcoinjs_lib_1.crypto.taggedHash('TapTweak', tapKey));
        psbt.signAllInputs(this.addrType !== 'taproot' ? key : tweakedKey);
        psbt.finalizeAllInputs();
        return psbt.extractTransaction();
    }
    sendTransaction(outputs_1) {
        return __awaiter(this, arguments, void 0, function* (outputs, populateOptions = {}) {
            const coinTx = yield this.populateTransaction(outputs, populateOptions);
            yield this.populatePsbt(coinTx);
            const signed = this.signTransaction(coinTx.psbt);
            coinTx.txid = yield this.provider.broadcastTransaction(signed.toHex());
            return coinTx;
        });
    }
    sendConsolidations() {
        return __awaiter(this, arguments, void 0, function* ({ customFeePerByte, cachedBalance, requiredConfirmations, } = {}) {
            const txs = yield this.populateConsolidation({
                customFeePerByte,
                cachedBalance,
                requiredConfirmations,
            });
            for (let i = 0; i < txs.length; ++i) {
                const tx = this.signTransaction(txs[i].psbt);
                txs[i].txid = yield this.provider.broadcastTransaction(tx.toHex());
            }
            return txs;
        });
    }
}
exports.CoinWallet = CoinWallet;
class MnemonicWallet extends CoinWallet {
    constructor(provider, config, onlySingle = false, generateRandom = true) {
        super(provider, config, false);
        this.mnemonic =
            config.mnemonic || (generateRandom ? (0, bip39_1.generateMnemonic)(128) : '');
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
        const root = factory_1.bip32.fromSeed((0, bip39_1.mnemonicToSeedSync)(this.mnemonic), this.network);
        const key = root.derivePath(`m/${(0, coinUtils_1.getDerivation)(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'`);
        // taproot pubkey is implemented as descriptors
        // https://github.com/satoshilabs/slips/issues/1194
        if (this.addrType === 'taproot') {
            return `tr(${key.neutered().toBase58()})`;
        }
        // https://github.com/bitcoinjs/bitcoinjs-lib/issues/1258
        const data = Buffer.concat([
            Buffer.from((0, coinUtils_1.getPubBytes)(this.addrType), 'hex'),
            bs58check_1.default.decode(key.neutered().toBase58()).slice(4),
        ]);
        return bs58check_1.default.encode(data);
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
        const root = factory_1.bip32.fromSeed((0, bip39_1.mnemonicToSeedSync)(this.mnemonic), this.network);
        return root.derivePath(`m/${(0, coinUtils_1.getDerivation)(this.addrType)}'/${this.network.versions.bip44 || 0}'/0'/0/${index}`);
    }
    getBip32Derivation(index = 0) {
        if (this.onlySingle) {
            return super.getBip32Derivation(index);
        }
        const root = factory_1.bip32.fromSeed((0, bip39_1.mnemonicToSeedSync)(this.mnemonic), this.network);
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
        const root = factory_1.bip32.fromSeed((0, bip39_1.mnemonicToSeedSync)(this.mnemonic), this.network);
        // https://github.com/snapdao/btcsnap/pull/140
        if (this.addrType === 'taproot') {
            psbt.data.inputs.forEach((txInput, index) => {
                const derivation = txInput.tapBip32Derivation[0];
                const key = root.derivePath(derivation.path);
                const tapKey = key.publicKey.slice(1, 33);
                const tweakedKey = key.tweak(bitcoinjs_lib_1.crypto.taggedHash('TapTweak', tapKey));
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
    constructor(provider, config) {
        super(provider, config, false);
        this.publicKey = config.publicKey;
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
exports.default = MnemonicWallet;
