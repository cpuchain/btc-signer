import { BigNumber as BigNumberJS } from 'bignumber.js';
import { bitcoin as bitcoinjs } from './bitcoinjs';

export const bitcoin = (globalThis as { bitcoin?: typeof bitcoinjs })?.bitcoin || bitcoinjs;

export const BigNumber = (globalThis as { BigNumber?: typeof BigNumberJS })?.BigNumber || BigNumberJS;
