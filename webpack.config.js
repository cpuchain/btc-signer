const path = require('path');
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
                    target: 'es2016',
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
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        minimize: false,
    },
    plugins: [
        new NodePolyfillPlugin(),
    ]
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
        entry: './src/bip39org.ts',
        output: {
            filename: 'bip39org.umd.js',
            path: path.resolve(__dirname, './lib'),
            library: 'bip39org',
            libraryTarget: 'umd'
        },
    },
    {
        ...config,
        entry: './src/bip39org.ts',
        output: {
            filename: 'bip39org.umd.min.js',
            path: path.resolve(__dirname, './lib'),
            library: 'bip39org',
            libraryTarget: 'umd'
        },
        optimization: {},
    }
]
