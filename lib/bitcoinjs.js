"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitcoin = void 0;
const buffer_1 = require("buffer");
const bitcoinJS = __importStar(require("bitcoinjs-lib"));
const bip32_1 = __importDefault(require("bip32"));
const bip39 = __importStar(require("bip39"));
const bs58check_1 = __importDefault(require("bs58check"));
const ecpair_1 = __importDefault(require("ecpair"));
const ecc = __importStar(require("@bitcoinerlab/secp256k1"));
const coininfo_1 = __importDefault(require("coininfo"));
exports.bitcoin = bitcoinJS;
// Prevent DOM import error
// No need to init on child lib since it is already done on bitcoin.umd.js
if (exports.bitcoin?.initEccLib) {
    exports.bitcoin.initEccLib(ecc);
    exports.bitcoin.bip32 = (0, bip32_1.default)(ecc);
    exports.bitcoin.bip39 = bip39;
    exports.bitcoin.bs58check = bs58check_1.default;
    exports.bitcoin.Buffer = buffer_1.Buffer;
    exports.bitcoin.coininfo = coininfo_1.default;
    exports.bitcoin.ECPair = (0, ecpair_1.default)(ecc);
}
