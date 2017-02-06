const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: [
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
        new webpack.NoErrorsPlugin(),
        // TODO: Not sure why it doesn't work
        // new webpack.optimize.UglifyJsPlugin({
        //     compressor: {
        //         warnings: false,
        //         screw_ie8: true
        //     }
        // }),
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