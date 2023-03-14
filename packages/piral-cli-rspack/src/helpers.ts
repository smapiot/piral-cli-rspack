import { existsSync } from 'fs';
import { Configuration } from '@rspack/core';
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
