/* @flow */

import Future from "fluture";
import {
	always,
	chain,
	ifElse,
	map,
	pipe,
	slice,
	trim,
	identity,
	filter,
	isNil,
	any,
	assoc,
	toPairs,
	reduce,
	applySpec,
	propSatisfies,
	prop,
} from "ramda";
import { concatAll } from "ramda-adjunct";
import { fromCommand } from "@eric.dahlseng/cli-tools";
import fs from "fs";
import path from "path";

import {
	deDuplicate,
	futureSequential,
	from,
	setupConfigurationFile,
	assocObject,
	setupJsonData,
} from "./utils.js";

const withoutAlternates = availableOptions => {
	const optionsMapper = reduce(
		(mapper, [optionName, option]) => ({
			...mapper,
			[optionName]: optionName,
			...option.alternateNames.reduce((nameMap, alternateName) => ({
				...nameMap,
				[alternateName]: optionName,
			})),
		}),
		{},
		toPairs(availableOptions),
	);

	return pipe(
		map(applySpec({ specified: identity, mapped: from(optionsMapper) })),
		ifElse(
			any(propSatisfies(isNil)("mapped")),
			pipe(
				filter(propSatisfies(isNil)("mapped")),
				map(prop("specified")),
				unsupportedOptions =>
					`Unsupported option${
						unsupportedOptions.length > 1 ? "s" : ""
					}: ${unsupportedOptions}`,
				Future.reject,
			),
			pipe(
				map(prop("specified")),
				Future.of,
			),
		),
	);
};

const chosenOptions = options =>
	pipe(
		ifElse(
			xs => xs.length < 4,
			always(Future.reject("No options specified")),
			Future.of,
		),
		map(slice(3, Infinity)),
		chain(withoutAlternates(options)),
		map(deDuplicate),
		map(map(from(options))),
	);

const defaultOptions = {
	"javascript-browser": {
		alternateNames: ["js-browser"],
		configurationFiles: [
			{
				path: "./webpack.config.js",
				content: fs.readFileSync(
					path.resolve(__dirname, "./webpack.template.js"),
				),
			},
		],
		jsonData: [
			{
				filePath: "./package.json",
				dataPath: ["scripts", "build"],
				content: "rm -rf ./dist && webpack --config ./webpack.config.js",
			},
		],
	},
	"javascript-module": {
		alternateNames: ["js-module"],
		jsonData: [
			{
				filePath: "./package.json",
				dataPath: ["scripts", "build"],
				content:
					"rm -rf ./dist && babel sources --out-dir dist --copy-files --source-maps inline",
			},
			{
				filePath: "./package.json",
				dataPath: ["babel"],
				content: {
					extends:
						"./node_modules/@eric.dahlseng/configuration-build/babelrc.browser.json",
				},
			},
		],
	},
	"javascript-node": {
		alternateNames: ["js-node"],
		jsonData: [
			{
				filePath: "./package.json",
				dataPath: ["scripts", "build"],
				content:
					"rm -rf ./dist && babel sources --out-dir dist --copy-files --source-maps inline",
			},
			{
				filePath: "./package.json",
				dataPath: ["babel"],
				content: {
					extends:
						"./node_modules/@eric.dahlseng/configuration-build/babelrc.node.json",
				},
			},
		],
	},
};

const setupOption = ({ configurationFiles = [], jsonData = [] }) =>
	concatAll([
		configurationFiles.map(setupConfigurationFile),
		jsonData.map(setupJsonData),
	]);

export const setup = ({
	options = {},
	process,
}: {
	options?: { [string]: {} },
	process: { env: { [string]: ?string }, argv: Array<string> },
}) =>
	fromCommand("npm prefix", { cwd: process.env.INIT_CWD })
		.map(trim)
		.chain(projectRootDirectory =>
			chosenOptions(assocObject(options, defaultOptions))(process.argv)
				.map(map(assoc("projectRootDirectory")(projectRootDirectory)))
				.map(map(setupOption))
				.map(concatAll),
		)
		.chain(futureSequential);
