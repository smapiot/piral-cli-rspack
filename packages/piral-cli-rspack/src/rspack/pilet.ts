import type { PiletBuildHandler, PiletSchemaVersion, SharedDependency } from 'piral-cli';
import { resolve, join } from 'path';
import { runWebpack } from './bundler-run';
import { getRules, getPlugins, extensions, getVariables, DefaultConfiguration } from './common';
import { defaultRspackConfig } from '../constants';
import { extendConfig } from '../helpers';
import { Configuration } from '@rspack/core';

async function getConfig(
  template: string,
  dist: string,
  filename: string,
  externals: Array<string>,
  importmap: Array<SharedDependency> = [],
  piralInstances: Array<string>,
  schema: PiletSchemaVersion,
  develop = false,
  sourceMaps = true,
  contentHash = true,
  minimize = true,
): Promise<DefaultConfiguration> {
  const production = !develop;
  const name = process.env.BUILD_PCKG_NAME;
  const version = process.env.BUILD_PCKG_VERSION;
  const entry = filename.replace(/\.js$/i, '');

  const enhance = (options: Configuration) => [].reduceRight((acc, val) => val(acc), options);

  return [
    {
      devtool: sourceMaps ? (develop ? 'cheap-module-source-map' : 'source-map') : false,

      mode: develop ? 'development' : 'production',

      entry: {
        [entry]: [join(__dirname, '..', 'set-path'), template],
      },

      output: {
        publicPath: './',
        path: dist,
        filename: '[name].js',
        chunkFilename: contentHash ? '[chunkhash:8].js' : undefined,
      },

      resolve: {
        extensions,
      },

      module: {
        rules: getRules(production),
      },

      optimization: {
        minimize,
      },

      plugins: getPlugins([], production, entry),
    },
    enhance,
  ];
}

const handler: PiletBuildHandler = {
  async create(options) {
    const { config = defaultRspackConfig } = options.args._;
    const otherConfigPath = resolve(options.root, config);
    const baseConfig = await getConfig(
      options.entryModule,
      options.outDir,
      options.outFile,
      options.externals,
      options.importmap,
      options.piralInstances,
      options.version,
      options.develop,
      options.sourceMaps,
      options.contentHash,
      options.minify,
    );
    const wpConfig = extendConfig(baseConfig, otherConfigPath, {
      watch: options.watch,
    });

    return runWebpack(wpConfig, options.logLevel);
  },
};

export const create = handler.create;
