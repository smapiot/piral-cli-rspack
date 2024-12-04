import { Compiler, Configuration, rspack, Stats } from '@rspack/core';
import { resolve, basename, dirname } from 'path';
import { EventEmitter } from 'events';
import type { LogLevels, BundleHandlerResponse } from 'piral-cli';

function getOutput(outDir: string, stats: Stats) {
  const { assetsByChunkName, entrypoints } = stats.toJson();
  const [main] = Object.keys(entrypoints);
  const entry = assetsByChunkName[main].find(m => m.endsWith('.js'));
  return resolve(outDir, entry);
}

function getPreset(logLevel: LogLevels) {
  switch (logLevel) {
    case 0: //LogLevels.disabled
      return 'none';
    case 1: //LogLevels.error
      return 'errors-only';
    case 2: //LogLevels.warning
      return 'errors-warnings';
    case 4: //LogLevels.verbose
    case 5: //LogLevels.debug
      return 'verbose';
    case 3: //LogLevels.info
    default:
      return 'normal';
  }
}

export function runRspack(rspConfig: Configuration, logLevel: LogLevels): BundleHandlerResponse {
  const eventEmitter = new EventEmitter();
  const outDir = rspConfig.output.path;
  const preset = getPreset(logLevel);
  const bundle = {
    outFile: '',
    outDir,
    name: '',
    hash: '',
    requireRef: undefined,
  };

  const updateBundle = (stats: Stats) => {
    const file = getOutput(outDir, stats);
    bundle.name = basename(file);
    bundle.requireRef = stats.compilation.outputOptions?.uniqueName?.replace('_chunks', '');
    bundle.hash = stats.hash;
    bundle.outFile = `/${basename(file)}`;
    bundle.outDir = dirname(file);
  };

  rspConfig.plugins.push({
    apply(compiler: Compiler) {
      compiler.hooks.beforeRun.tap('piral-cli', () => {
        eventEmitter.emit('start');
      });

      compiler.hooks.done.tap('piral-cli', (stats) => {
        updateBundle(stats);
        eventEmitter.emit('end', bundle);
      });
    },
  });

  return {
    bundle() {
      return new Promise((resolve, reject) => {
        rspack(rspConfig, (err, stats) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            console.log(stats.toString(preset));

            if (stats.hasErrors()) {
              reject(stats.toJson(preset));
            } else {
              updateBundle(stats);
              resolve(bundle);
            }
          }
        });
      });
    },
    onStart(cb) {
      eventEmitter.on('start', cb);
    },
    onEnd(cb) {
      eventEmitter.on('end', cb);
    },
  };
}
