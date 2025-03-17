
const {resolve} = require('path');

module.exports = {
    entry: {
        index: './src/index.ts',
        node: './src/node.ts',
        terminal: './src/terminal.ts',
        window: './src/window.ts',
    },
    output: {
        filename: '[name].js',
        path: resolve(__dirname, 'dist'),
        publicPath: '/',
    },
    resolve: {
        extensions: ['.js', '.ts'],
        modules: [resolve(__dirname, 'node_modules'), resolve(__dirname, '../plugins/node/node_modules')],
        symlinks: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                options: {presets: ['@babel/preset-env']},
            },
            {
                exclude: /node_modules/,
                test: /\.ts$/,
                loader: 'babel-loader',
                options: {presets: ['@babel/preset-env', '@babel/preset-typescript']},
            },
        ],
    },
    devtool: 'source-map',
};
