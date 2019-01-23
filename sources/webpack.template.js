/* eslint flowtype/require-valid-file-annotation: 0 */
/* global require:false module:false */

const path = require("path");
const { map } = require("ramda");
const webpack = require("webpack");
const babelBrowser = require("@eric.dahlseng/configuration-build/babel.browser.json");

const commonConfig = () => ({
	name: "",
	entry: {},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [{ loader: "babel-loader", options: babelBrowser }],
			},
		],
	},
	plugins: [],
	output: {
		publicPath: "/resources/",
		path: path.resolve(__dirname, "./dist/resources/"),
		filename: "[chunkhash].js",
	},
});

const testingConfig = ({ localDevelopment } = {}) => {
	const config = {
		...commonConfig(),
		devtool: "inline-source-map",
		mode: "development",
	};

	if (localDevelopment) {
		return {
			...config,
			plugins: config.plugins.concat([
				new webpack.HotModuleReplacementPlugin(),
				new webpack.NoEmitOnErrorsPlugin(),
			]),
			entry: map(entry =>
				(Array.isArray(entry) ? entry : [entry]).concat([
					`webpack-hot-middleware/client?name=${
						config.name
					}&timeout=20000&reload=true&quiet=false&noInfo=false`,
				]),
			)(config.entry),
			output: {
				...config.output,
				filename: "[name].js",
			},
		};
	}

	return config;
};

const productionConfig = ({ localDevelopment } = {}) => {
	if (localDevelopment) return null;

	return { ...commonConfig(), mode: "production" };
};

module.exports = [testingConfig, productionConfig];
