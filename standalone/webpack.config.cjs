
const {resolve} = require('path');

const envPreset = [
    '@babel/preset-env',
    {
        targets: '> 0.5%, not dead',
    },
];

module.exports = function(env, argv) {
    return {
        entry: 'index.ts',
        output: {
            filename: '[name].js',
            path: resolve(__dirname, 'dist'),
            publicPath: '/',
            library: 'FakeNode',
        },
        resolve: {
            extensions: ['.js', '.ts', '.jsx', '.tsx'],
            modules: resolve(__dirname, 'node_modules'),
            symlinks: true,
        },
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
        devtool: argv.mode === 'development' ? 'source-map' : undefined,
    }
}
