import { existsSync } from 'fs';
import { Configuration } from '@rspack/core';
import type { SharedDependency } from 'piral-cli';
import { DefaultConfiguration } from './rspack/common';

export function extendConfig(
  [rsPackConfig, enhancer]: DefaultConfiguration,
  otherConfigPath: string,
  overrides: Configuration = {},
): Configuration {
  if (existsSync(otherConfigPath)) {
    const otherConfig = require(otherConfigPath);

    if (typeof otherConfig === 'function') {
      rsPackConfig = otherConfig(rsPackConfig);
    } else if (typeof otherConfig === 'object') {
      return {
        ...rsPackConfig,
        ...otherConfig,
        ...overrides,
      };
    } else {
      console.warn(`Did not recognize the export from "${otherConfigPath}". Skipping.`);
    }
  }

  return enhancer({
    ...rsPackConfig,
    ...overrides,
  });
}
export function getShared(importmap: Array<SharedDependency>, externals: Array<string>) {
  const shared = {};

  for (const external of externals) {
    shared[external] = {
      import: false,
      requiredVersion: '*',
      packageName: external,
      singleton: true,
    };
  }

  for (const dep of importmap) {
    if (dep.type === 'local') {
      shared[dep.name] = {
        eager: false,
        requiredVersion: dep.requireId.split('@').pop(),
        version: dep.id.split('@').pop(),
        packageName: dep.entry,
        singleton: true,
      };
    }
  }

  return shared;
}
