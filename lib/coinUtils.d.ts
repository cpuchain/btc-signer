import type { Network } from 'bitcoinjs-lib';
import type { addrType } from './types';
export declare function formatCoins(amount: bigint | number | string, decimals?: number): string;
export declare function parseCoins(amount: number | string, decimals?: number): number;
export declare function getDerivation(addrType: addrType): 86 | 84 | 49 | 44;
export declare function getBytes(addrType: addrType, isInput?: boolean): 58 | 43 | 68 | 31 | 91 | 32 | 148 | 34 | 392;
export declare function getScriptType(script: Buffer): addrType;
export declare function getAddress(pubkey: Buffer, addrType: addrType, network: Network): string | undefined;
export declare function getPubBytes(addrType: addrType): "049d7cb2" | "04b24746" | "0488b21e";
