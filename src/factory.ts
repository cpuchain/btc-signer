import { BigNumber as BigNumberJS } from 'bignumber.js';
import * as _blockbook from 'blockbook-fetcher';
import { bitcoin as bitcoinjs } from './bitcoinjs';

export const bitcoin = (globalThis as { bitcoin?: typeof bitcoinjs })?.bitcoin || bitcoinjs;

export const blockbook = (globalThis as { blockbook?: typeof _blockbook })?.blockbook || _blockbook;

export const BigNumber = (globalThis as { BigNumber?: typeof BigNumberJS })?.BigNumber || BigNumberJS;
