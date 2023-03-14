import type { PiralBuildHandler } from 'piral-cli';
import { resolve } from 'path';
import { Configuration } from '@rspack/core';
import { getRules, getPlugins, extensions, getVariables, DefaultConfiguration } from './common';
import { runWebpack } from './bundler-run';
import { defaultRspackConfig } from '../constants';
import { html5EntryConfigEnhancer } from '../html';
import { extendConfig } from '../helpers';

async function getConfig(
  template: string,
  dist: string,
  externals: Array<string>,
  develop = false,
  sourceMaps = true,
  contentHash = true,
  minimize = true,
  publicPath = '/',
): Promise<DefaultConfiguration> {
  const name = process.env.BUILD_PCKG_NAME;
  const version = process.env.BUILD_PCKG_VERSION;
  const environment = process.env.NODE_ENV || 'development';
  const production = !develop;

  const enhance = (options: Configuration) =>
    [html5EntryConfigEnhancer({})].reduceRight((acc, val) => val(acc), options);

  return [
    {
      devtool: sourceMaps ? (develop ? 'cheap-module-source-map' : 'source-map') : false,

      mode: develop ? 'development' : 'production',

      entry: {
        main: [template],
      },

      output: {
        publicPath,
        path: dist,
        filename: `index.${contentHash ? '[hash:6].' : ''}js`,
        chunkFilename: contentHash ? '[chunkhash:6].js' : undefined,
      },

      resolve: {
        extensions,
        alias: {
          // Webpack v4 does not respect the "exports" section of a package.json
          // so we just (hacky) teach Webpack the special case of `piral-core`
          // etc. by introducing the alias definitions below
          'piral-base/_': 'piral-base/esm',
          'piral-core/_': 'piral-core/esm',
        },
      },

      builtins: {
        define: {
          ...getVariables(),
          NODE_ENV: environment,
          BUILD_TIME: new Date().toDateString(),
          BUILD_TIME_FULL: new Date().toISOString(),
          BUILD_PCKG_VERSION: version,
          BUILD_PCKG_NAME: name,
          SHARED_DEPENDENCIES: externals.join(','),
          DEBUG_PIRAL: '',
          DEBUG_PILET: '',
        },
      },

      module: {
        rules: getRules(production),
      },

      optimization: {
        minimize,
      },

      plugins: getPlugins([], production, undefined),
    },
    enhance,
  ];
}

const handler: PiralBuildHandler = {
  async create(options) {
    const { config = defaultRspackConfig } = options.args._;
    const otherConfigPath = resolve(options.root, config);
    const baseConfig = await getConfig(
      options.entryFiles,
      options.outDir,
      options.externals,
      options.emulator,
      options.sourceMaps,
      options.contentHash,
      options.minify,
      options.publicUrl,
    );
    const wpConfig = extendConfig(baseConfig, otherConfigPath, {
      watch: options.watch,
    });

    return runWebpack(wpConfig, options.logLevel);
  },
};

export const create = handler.create;
