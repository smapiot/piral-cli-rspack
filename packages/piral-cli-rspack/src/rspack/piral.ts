import type { PiralBuildHandler } from 'piral-cli';
import { getFreePort } from 'piral-cli/utils';
import { resolve } from 'path';
import { Configuration, DefinePlugin } from '@rspack/core';
import { getRules, extensions, getVariables, DefaultConfiguration, getDefineVariables } from './common';
import { runRspack } from './bundler-run';
import { defaultRspackConfig } from '../constants';
import { html5EntryConfigEnhancer } from '../html';
import { hmrConfigEnhancer } from '../hmr';
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
  hmr = 0,
): Promise<DefaultConfiguration> {
  const name = process.env.BUILD_PCKG_NAME;
  const version = process.env.BUILD_PCKG_VERSION;
  const environment = process.env.NODE_ENV || 'development';

  const enhance = (options: Configuration) =>
    [hmrConfigEnhancer({ port: hmr }), html5EntryConfigEnhancer()].reduceRight((acc, val) => val(acc), options);

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

      module: {
        rules: getRules([
          {
            test: /\.s[ac]ss$/i,
            use: [require.resolve('sass-loader')],
            type: 'css/auto',
          },
          {
            test: /\.css$/i,
            use: [],
            type: 'css/auto',
          },
        ]),
      },

      optimization: {
        minimize,
      },

      experiments: {
        css: true,
      },

      plugins: [
        new DefinePlugin(
          getDefineVariables({
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
        ),
      ],
    },
    enhance,
  ];
}

function getRandomPort() {
  const min = 60000;
  const max = 65536;
  const rng = max - min;
  return ~~(Math.random() * rng) + min;
}

const handler: PiralBuildHandler = {
  async create(options) {
    const { 'hmr-port': defaultHmrPort = getRandomPort(), config = defaultRspackConfig } = options.args._;
    const hmrPort = options.hmr ? await getFreePort(defaultHmrPort) : 0;
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
      hmrPort,
    );
    const rspConfig = extendConfig(baseConfig, otherConfigPath, {
      watch: options.watch,
    });

    return runRspack(rspConfig, options.logLevel);
  },
};

export const create = handler.create;
