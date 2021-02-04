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
        'stubr': ['./src/lib/main.ts']
    },
    output: {
        path: path.resolve(process.cwd(), './dist'),
        filename: '[name].common.js',
        library: 'Stubr',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.build.json'
	            }
            }
        ]
    },
    externals: [nodeExternals()],
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, '../globals.d.ts'), to: path.resolve(process.cwd(), './dist') }
            ]
        })
    ]
};