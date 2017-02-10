const path = require('path')
const webpack = require('webpack')

module.exports = {
    devtool: '#source-map',

    entry: [
    	'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
    	path.join(__dirname, 'src/index.js')
    ],
    output: {
        path: path.join(__dirname, '/dist/'),
        filename: 'app.bundle.js',
        publicPath: '/'
    },

    plugins: [
        // OccurenceOrderPlugin is needed for webpack 1.x only
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],

    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
    }, {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    }]
};