const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

module.exports = {
    entry: {
        'stubr-ui': ['./src/ui/06_app/main.ts'],
    },
    output: {
        path: path.resolve(process.cwd(), './static'),
        publicPath: '/',
        filename: '[name].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: file => (
                    /node_modules/.test(file) &&
                    !/\.vue\.js/.test(file)
                )
            },
            {
	            test: /\.ts$/,
	            loader: 'ts-loader',
	            options: {
	            	appendTsSuffixTo: [/\.vue$/],
                    configFile: './tsconfig.json'
	            }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.svg/,
                use: [{
                    loader: 'svg-inline-loader',
                    options: {
                        idPrefix: true
                    }
                }]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            }
        ]
    },
    resolve: {
	    extensions: ['.ts', '.d.ts', '.js', '.vue'],
        alias: {
            'vue$': 'vue/dist/vue.common.js'
        }
    },
    plugins: [
        new VueLoaderPlugin(),
        new FaviconsWebpackPlugin(path.join(__dirname, '../00_assets/img/logo.png')),
        new HtmlWebpackPlugin({
            template: 'src/ui/06_app/index.html',
            filename: 'index.html',
            hash: true,
            xhtml: true,
            inject: false,
            alwaysWriteToDisk: true
        }),
        new HtmlWebpackHarddiskPlugin()
    ],
    performance: {
        hints: false
    }
};
