const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

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
                exclude: /node_modules/,
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
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource'
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
        new HtmlWebpackPlugin({
            template: 'src/ui/06_app/index.html',
            filename: 'index.html',
            hash: true,
            xhtml: true,
            alwaysWriteToDisk: true
        })
    ],
    performance: {
        hints: false
    }
};
