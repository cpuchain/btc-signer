"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigNumber = exports.bitcoin = void 0;
const bignumber_js_1 = require("bignumber.js");
const bitcoinjs_1 = require("./bitcoinjs");
exports.bitcoin = globalThis?.bitcoin || bitcoinjs_1.bitcoin;
exports.BigNumber = globalThis?.BigNumber || bignumber_js_1.BigNumber;
