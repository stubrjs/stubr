const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const webpackBaseConfig = require('./webpack.base.config');

module.exports = merge(webpackBaseConfig, {
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    devServer: {
        contentBase: path.resolve(process.cwd(), './static'),
        historyApiFallback: true,
        noInfo: true,
        hot: true,
        port: 8080
    },
    devtool: 'inline-source-map',
    plugins: [
        new webpack.DefinePlugin({
            PRODUCTION: JSON.stringify(false)
        })
    ]
});
