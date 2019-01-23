/* @flow */

import fs from "fs";
import Future from "fluture";
import {
	always,
	ifElse,
	reduce,
	flip,
	prop,
	curry,
	isEmpty,
	assocPath,
} from "ramda";
import { hasPath } from "ramda-adjunct";
import { fileExists, readFile } from "@eric.dahlseng/cli-tools";
import writePkgPromise from "write-pkg";

export const ifTrueElse = ifElse(x => x === true);

export const readUtf8File = (path: string) => readFile(path, "utf8");
export const writeFile = Future.encaseN3(fs.writeFile);
export const writeUtf8FileToPath = (contents: string) => (path: string) =>
	writeFile(path, contents, "utf8");
export const jsonParse = Future.encase(JSON.parse);
export const writePkg = Future.encaseP3(writePkgPromise);

export const futureSequential = reduce(
	(acc, nextFuture) => acc.chain(() => nextFuture),
	Future.of(),
);

export const deDuplicate = <A: *>(xs: Array<A>): Array<A> =>
	Array.from(new Set(xs));

export const setupConfigurationFile = ({
	content,
	path,
}: {
	content: string,
	path: string,
}) =>
	fileExists(path).chain(
		ifTrueElse(always(Future.of()), always(writeUtf8FileToPath(content)(path))),
	);

export const from = flip(prop);

export const assocObject = curry((object: {}, sourceObject: {}) => {
	const newObject = { ...sourceObject };
	for (const key in object) {
		object[key] !== null &&
		typeof object[key] === "object" &&
		object[key].constructor === Object &&
		!isEmpty(object[key])
			? (newObject[key] = assocObject(object[key], newObject[key]))
			: (newObject[key] = object[key]);
	}
	return newObject;
});

type setupJsonDataInput = {
	filePath: string,
	dataPath: Array<string>,
	content: string,
};
export const setupJsonData = ({
	filePath,
	dataPath,
	content,
}: setupJsonDataInput) =>
	readUtf8File(filePath)
		.chain(jsonParse)
		.chain(
			ifElse(hasPath(dataPath), always(Future.of()), packageJson =>
				writePkg(filePath, assocPath(dataPath, content)(packageJson), {}),
			),
		);
