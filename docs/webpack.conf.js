const path = require('path')

module.exports = {
    // mode: 'development',
    mode: 'production',
    entry: {
        script: path.resolve(__dirname, './script.ts')
    },
    output: {
        path: path.resolve(__dirname, './view'), 
        filename: '[name].js', 
        publicPath: '/'
    },
    // devtool: "source-map",
    module: {
        rules: [
            { 
                test: /\.tsx?$/,
                loader: "ts-loader"
            }
        ]
    }
}