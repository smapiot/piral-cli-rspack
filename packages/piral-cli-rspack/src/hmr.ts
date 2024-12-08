import { HotModuleReplacementPlugin, Configuration, WebpackPluginInstance, Compiler } from '@rspack/core';

class HotModuleServerPlugin implements WebpackPluginInstance {
  constructor(private hmrPort: number) {}

  apply(compiler: Compiler) {
    const express = require('express');
    const app = express();
    app.use(require('../src/webpack-hot-middleware/middleware')(compiler));
    app.listen(this.hmrPort, () => {});
  }
}

export interface HmrPluginOptions {
  port: number;
}

function getHmrEntry(hmrPort: number): [] | [string] {
  return hmrPort
    ? [`piral-cli-rspack/src/webpack-hot-middleware/client?path=http://localhost:${hmrPort}/__webpack_hmr&reload=true`]
    : [];
}

export const hmrConfigEnhancer = (options: HmrPluginOptions) => (compilerOptions: Configuration) => {
  const { port } = options;

  if (port) {
    if (Array.isArray(compilerOptions.entry)) {
      compilerOptions.entry.unshift(...getHmrEntry(port));
    }

    const newPlugins = [new HotModuleReplacementPlugin(), new HotModuleServerPlugin(port)];

    if (!compilerOptions.plugins) {
      compilerOptions.plugins = newPlugins;
    } else if (Array.isArray(compilerOptions.plugins)) {
      compilerOptions.plugins.push(...newPlugins);
    }
  }

  return compilerOptions;
};
