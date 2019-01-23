Build Configuration
===================

A collection of configuration files for transpilation and building.

Installation
------------

```bash
npm install --save-dev @edahlseng/configuration-build
```

Usage
-----

After installing, run `npx configuration-build setup [build-types]` to set up configuration for the desired build-types.

Available build-types:
* `javascript-browser` (or `js-browser`)
* `javascript-module` (or `js-module`)
* `javascript-node` (or `js-node`)

### Example

Running `npx linter-configuration setup js-module` will add a `babel` key to a project's `package.json` file as well as the `build` script, configuring Babel to transpile the module's source into a `dist/` folder.

API
---

This tool can be extended for use in a custom configuration library. To do so, create a file that can be run as a Node executable, and pass in an `options` object and the `process` global object to the `setup` function exported by this module:

````js
#!/usr/bin/env node

import { setup } from '@eric.dahlseng/configuration-build';

setup({ process, options: { /* options here */}}).fork(console.error, () => {});
````

The `options` object should be a map where the keys are build types, and the values are objects with the following fields:
* `alternateNames` (optional): An array of alternate names for the build type. This is useful for specifying abbreviations.
* `configurationFiles` (optional): An array of objects containing a `path` and `content`
* `jsonData` (optional): An array of objects containing `filePath`, `dataPath`, and `content`
