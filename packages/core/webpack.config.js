const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    target: 'node',
    node: {
        __dirname: false
    },
    entry: {
        stubr: ['./src/main.ts']
    },
    output: {
        path: path.resolve(process.cwd(), './dist'),
        filename: '[name].common.js',
        library: 'Stubr',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    },
    externals: [nodeExternals(), 'utf-8-validate', 'bufferutil'],
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(
                        process.cwd(),
                        '../../node_modules/@stubr/ui/dist/'
                    ),
                    to: path.resolve(process.cwd(), './static')
                },
                {
                    from: path.resolve(process.cwd(), './src/globals.d.ts'),
                    to: path.resolve(process.cwd(), './dist')
                }
            ]
        })
    ]
};
