
const {resolve} = require('path');

module.exports = function(env, argv) {
    return {
        entry: {
            index: './index.ts',
            node: './node.ts',
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
        devtool: argv.mode === 'development' ? 'source-map' : undefined,
    }
}
