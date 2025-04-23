"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.chunk = void 0;
exports.checkHex = checkHex;
const chunk = (arr, size) => [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
exports.chunk = chunk;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
function checkHex(hexStr) {
    try {
        if (hexStr.slice(0, 2) !== '0x') {
            return false;
        }
        BigInt(hexStr);
        return true;
    }
    catch {
        return false;
    }
}
