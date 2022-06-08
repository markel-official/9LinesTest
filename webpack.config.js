const path = require('path');

module.exports = {
	entry: './src/js/main.js',

	// entry: {
	//     main: './src/js/main.js',
	//     preloader: './src/js/preloader.js'
	//     // main: __dirname+'src/js/main.js',
	//     // preloader: __dirname+'src/js/preloader.js',
	// },

	// entry: './src/js/main.js',

	/* entry: {
        'main': './src/js/main.js',
        'preloader': './src/js/preloader.js',
        // main: './src/js/main.js',
        // preloader: './src/js/preloader.js',
    },
    entry: {
        'main': { import: './main.js', filename: 'src/js/[name][ext]' },
        'preloader': { import: './preloader.js', filename: 'src/js/[name][ext]' }
    },
    entry: {
        foo: './src/js/main.js',
        bar: './src/js/preloader.js'
    }, */

	output: {
		// path: __dirname+'build/js',
		path: path.resolve(__dirname, 'build/js'),
		filename: '[name].js',
	},

	// output: {
	//     filename: '[name].js',
	//     sourceMapFilename: '[name].map'
	// },
	// devtool: '#source-map',

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules|bower_components/,
				use: {
					loader: 'babel-loader',
				},
			},
		],
	},

	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					chunks: 'initial',
					test: /node_modules|bower_components/,
					name: 'vendor',
					enforce: true,
				},
			},
		},
	},
	devtool: 'source-map',
};
