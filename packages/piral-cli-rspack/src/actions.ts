import { resolve } from 'path';
import type {
  DebugPiletBundlerDefinition,
  DebugPiralBundlerDefinition,
  BuildPiletBundlerDefinition,
  BuildPiralBundlerDefinition,
  WatchPiralBundlerDefinition,
} from 'piral-cli';
import { defaultRspackConfig } from './constants';

export const watchPiral: WatchPiralBundlerDefinition = {
  path: resolve(__dirname, 'rspack', 'piral.js'),
};

export const debugPiral: DebugPiralBundlerDefinition = {
  flags(argv) {
    return argv
      .string('config')
      .describe('config', 'Sets configuration file for modifying the rspack configuration.')
      .default('config', defaultRspackConfig);
  },
  path: resolve(__dirname, 'rspack', 'piral.js'),
};

export const buildPiral: BuildPiralBundlerDefinition = {
  flags(argv) {
    return argv
      .string('config')
      .describe('config', 'Sets configuration file for modifying the rspack configuration.')
      .default('config', defaultRspackConfig);
  },
  path: resolve(__dirname, 'rspack', 'piral.js'),
};

export const debugPilet: DebugPiletBundlerDefinition = {
  flags(argv) {
    return argv
      .string('config')
      .describe('config', 'Sets configuration file for modifying the rspack configuration.')
      .default('config', defaultRspackConfig);
  },
  path: resolve(__dirname, 'rspack', 'pilet.js'),
};

export const buildPilet: BuildPiletBundlerDefinition = {
  flags(argv) {
    return argv
      .string('config')
      .describe('config', 'Sets configuration file for modifying the rspack configuration.')
      .default('config', defaultRspackConfig);
  },
  path: resolve(__dirname, 'rspack', 'pilet.js'),
};
