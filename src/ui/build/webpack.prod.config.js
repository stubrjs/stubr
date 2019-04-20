const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const webpackBaseConfig = require('./webpack.base.config');

module.exports = merge(webpackBaseConfig, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            PRODUCTION: JSON.stringify(true)
        }),
        new MiniCssExtractPlugin({
            filename: '[name].bundle.css'
        })
    ]
});
