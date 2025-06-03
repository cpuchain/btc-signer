const path = require('path');
const { BannerPlugin } = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const config = {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'ts',
                    target: 'es2022',
                }
            }
        ]
    },
    entry: './src/index.ts',
    output: {
        filename: 'btcSigner.umd.js',
        path: path.resolve(__dirname, './lib'),
        library: 'btcSigner',
        libraryTarget: 'umd'
    },
    plugins: [
        new BannerPlugin({
            banner: `if (!globalThis.process?.browser) {
    globalThis.process = { browser: true, env: {}, };
}`,
            raw: true,
        }),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            crypto: false,
            '@bitcoinerlab/secp256k1': false,
            'bignumber.js': false,
            bip32: false,
            bip39: false,
            'bitcoinjs-lib': false,
            bs58check: false,
            coininfo: false,
            ecpair: false,
            'blockbook-fetcher': false,
        },
    },
    optimization: {
        minimize: false,
    },
}

module.exports = [
    config,
    {
        ...config,
        output: {
            filename: 'btcSigner.umd.min.js',
            path: path.resolve(__dirname, './lib'),
            library: 'btcSigner',
            libraryTarget: 'umd'
        },
        optimization: {},
    },
    {
        ...config,
        entry: './src/bitcoinjs.ts',
        output: {
            filename: 'bitcoin.umd.js',
            path: path.resolve(__dirname, './lib'),
            libraryTarget: 'umd'
        },
        plugins: [
            ...config.plugins,
            new NodePolyfillPlugin(),
        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
    },
    {
        ...config,
        entry: './src/bitcoinjs.ts',
        output: {
            filename: 'bitcoin.umd.min.js',
            path: path.resolve(__dirname, './lib'),
            libraryTarget: 'umd'
        },
        plugins: [
            ...config.plugins,
            new NodePolyfillPlugin(),
        ],
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        optimization: {},
    },
]
