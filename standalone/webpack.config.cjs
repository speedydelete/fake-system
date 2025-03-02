
const {resolve} = require('path');

const envPreset = [
    '@babel/preset-env',
    {
        targets: '> 0.5%, not dead',
    },
];

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
            modules: [resolve(__dirname, 'node_modules')],
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    options: {presets: [envPreset]},
                },
                {
                    exclude: /node_modules/,
                    test: /\.ts$/,
                    loader: 'babel-loader',
                    options: {presets: [envPreset, '@babel/preset-typescript']},
                },
            ],
        },
        devtool: argv.mode === 'development' ? 'source-map' : undefined,
    }
}
