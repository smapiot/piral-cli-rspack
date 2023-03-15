import type { PiralBuildHandler } from 'piral-cli';
import { resolve } from 'path';
import { Configuration } from '@rspack/core';
import { getRules, getPlugins, extensions, getVariables, DefaultConfiguration, getDefineVariables } from './common';
import { runRspack } from './bundler-run';
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

      entry: [template],

      output: {
        publicPath,
        path: dist,
        filename: `index.${contentHash ? '[contenthash:6].' : ''}js`,
        chunkFilename: contentHash ? '[chunkhash:6].js' : undefined,
      },

      resolve: {
        extensions,
      },

      builtins: {
        define: getDefineVariables({
          ...getVariables(),
          NODE_ENV: environment,
          BUILD_TIME: new Date().toDateString(),
          BUILD_TIME_FULL: new Date().toISOString(),
          BUILD_PCKG_VERSION: version,
          BUILD_PCKG_NAME: name,
          SHARED_DEPENDENCIES: externals.join(','),
          DEBUG_PIRAL: '',
          DEBUG_PILET: '',
        }),
      },

      module: {
        rules: getRules(),
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
    const rspConfig = extendConfig(baseConfig, otherConfigPath, {
      watch: options.watch,
    });

    return runRspack(rspConfig, options.logLevel);
  },
};

export const create = handler.create;
