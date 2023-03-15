[![Piral Logo](https://github.com/smapiot/piral/raw/main/docs/assets/logo.png)](https://piral.io)

# [Piral CLI rspack](https://piral.io) &middot; [![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/smapiot/piral-cli-rspack/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/piral-cli-rspack.svg?style=flat)](https://www.npmjs.com/package/piral-cli-rspack) [![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://jestjs.io) [![Gitter Chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/piral-io/community)

This plugin enables using [rspack](https://www.rspack.dev/) as the bundler for Piral instances and pilets.

## Installation

Use your favorite npm client for the installation:

```sh
npm i piral-cli-rspack --save-dev
```

## Using

There is nothing to do. Standard commands such as `piral build` or `pilet debug` will now work with rspack as the bundler.

This plugin comes with batteries included. You don't need to install or specify your rspack version.

### What's Inside

Right now it includes:

- `sass-loader`,
- `parcel-codegen-loader`,
- `@rspack/plugin-html`,and
- `@rspack/core`

As such it should be prepared to include assets (images, videos, ...), stylesheets (CSS and SASS), and work with TypeScript.

### Customizing

You can still leverage your own `rspack.config.js`. Either just export *what you want to have overwritten*, e.g.,

```js
module.exports = {
  devtool: 'inline-source-map',
};
```

or specify a function that is called with the already created configuration.

An example would be:

```js
module.exports = function(config) {
  config.plugins.push(myAwesomePlugin);
  config.entry.side = ['@babel/polyfill'];
  return config;
};
```

Otherwise, you can also use the `extend-config` helper module to get the job done without having to know the internals:

```js
const extendConfig = require('piral-cli-rspack/extend-config');

module.exports = extendConfig({
  rules: [], // adds additional rules
  removeRules: [], // removes the rules mentioned by their loader name
  plugins: [], // adds additional plugins
  removePlugins: [], // removes the plugins mentioned by their class reference
  sassLoaderOptions: {}, // sets the options for the SASS loader
});
```

If you want to name your rspack configuration different than `rspack.config.js` you can use the `--config` CLI option.

Example:

```sh
npx piral build --config my-rspack.js
```

## License

Piral is released using the MIT license. For more information see the [license file](./LICENSE).
