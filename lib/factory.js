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
exports.ECPair = exports.coininfo = exports.bip39 = exports.bip32 = exports.bitcoin = exports.Buffer = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bip32_1 = __importDefault(require("bip32"));
const ecpair_1 = __importDefault(require("ecpair"));
const ecc = __importStar(require("@bitcoinerlab/secp256k1"));
(0, bitcoinjs_lib_1.initEccLib)(ecc);
var bignumber_js_1 = require("bignumber.js");
Object.defineProperty(exports, "BigNumber", { enumerable: true, get: function () { return bignumber_js_1.BigNumber; } });
var buffer_1 = require("buffer");
Object.defineProperty(exports, "Buffer", { enumerable: true, get: function () { return buffer_1.Buffer; } });
exports.bitcoin = __importStar(require("bitcoinjs-lib"));
exports.bip32 = (0, bip32_1.default)(ecc);
exports.bip39 = __importStar(require("bip39"));
var coininfo_1 = require("coininfo");
Object.defineProperty(exports, "coininfo", { enumerable: true, get: function () { return __importDefault(coininfo_1).default; } });
exports.ECPair = (0, ecpair_1.default)(ecc);
