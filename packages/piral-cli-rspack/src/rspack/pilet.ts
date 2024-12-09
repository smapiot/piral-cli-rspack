import type { PiletBuildHandler, PiletSchemaVersion, SharedDependency } from 'piral-cli';
import { resolve, join } from 'path';
import {
  Configuration,
  DefinePlugin,
  LightningCssMinimizerRspackPlugin,
  SwcJsMinimizerRspackPlugin,
  CssExtractRspackPlugin,
} from '@rspack/core';
import { runRspack } from './bundler-run';
import { getRules, extensions, getVariables, DefaultConfiguration, getDefineVariables } from './common';
import { piletConfigEnhancer, piletCss } from '../library';
import { defaultRspackConfig } from '../constants';
import { extendConfig } from '../helpers';

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
  const name = process.env.BUILD_PCKG_NAME;
  const version = process.env.BUILD_PCKG_VERSION;
  const entry = filename.replace(/\.js$/i, '');
  const environment = process.env.NODE_ENV || 'development';
  const variables = getVariables();

  const enhance = (options: Configuration) =>
    [
      piletConfigEnhancer({
        name,
        piralInstances,
        version,
        entry,
        externals,
        importmap,
        schema,
        filename,
        variables,
      }),
    ].reduceRight((acc, val) => val(acc), options);

  return [
    {
      devtool: sourceMaps ? (develop ? 'cheap-module-source-map' : 'source-map') : false,

      mode: develop ? 'development' : 'production',

      entry: {
        [entry]: [join(__dirname, '..', 'set-path'), template],
      },

      output: {
        publicPath: undefined,
        path: dist,
        filename: '[name].js',
        chunkFilename: contentHash ? '[contenthash].js' : undefined,
      },

      resolve: {
        extensions,
      },

      module: {
        rules: getRules([
          {
            test: /\.s[ac]ss$/i,
            use: [CssExtractRspackPlugin.loader, require.resolve('sass-loader')],
            type: 'javascript/auto',
          },
          {
            test: /\.css$/i,
            use: [CssExtractRspackPlugin.loader, require.resolve('css-loader')],
            type: 'javascript/auto',
          },
        ]),
      },

      optimization: {
        minimize,
        minimizer: [
          new SwcJsMinimizerRspackPlugin({
            extractComments: false,
            minimizerOptions: {
              format: {
                comments: 'some',
              },
              mangle: {
                reserved: ['__bundleUrl__'],
              },
            },
          }),
          new LightningCssMinimizerRspackPlugin(),
        ],
      },

      plugins: [
        new CssExtractRspackPlugin({
          filename: piletCss,
          chunkFilename: '[id].[chunkhash:6].css',
        }),
        new DefinePlugin(
          getDefineVariables({
            ...getVariables(),
            NODE_ENV: environment,
            BUILD_TIME: new Date().toDateString(),
            BUILD_TIME_FULL: new Date().toISOString(),
            BUILD_PCKG_VERSION: version,
            BUILD_PCKG_NAME: name,
          }),
        ),
      ],
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
    const rspConfig = extendConfig(baseConfig, otherConfigPath, {
      watch: options.watch,
    });

    return runRspack(rspConfig, options.logLevel);
  },
};

export const create = handler.create;
