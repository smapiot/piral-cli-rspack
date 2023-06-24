import { Configuration, RuleSetRule } from '@rspack/core';
import SheetPlugin from '../plugin/SheetPlugin';

const piletCss = 'main.css';

export type ConfigEnhancer = (config: Configuration) => Configuration;

export type DefaultConfiguration = [Configuration, ConfigEnhancer];

export const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

export function getDefineVariables(variables: Record<string, boolean | string>) {
  return Object.entries(variables).reduce((obj, [name, value]) => {
    obj[`process.env.${name}`] = JSON.stringify(value);
    return obj;
  }, {});
}

export function getVariables(): Record<string, string> {
  return Object.keys(process.env).reduce((prev, curr) => {
    prev[curr] = process.env[curr];
    return prev;
  }, {});
}

export function getPlugins(plugins: Array<any>, production: boolean, pilet?: string) {
  const otherPlugins = [];

  if (production) {
    if (pilet) {
      const name = process.env.BUILD_PCKG_NAME;
      otherPlugins.push(new SheetPlugin(piletCss, name, pilet));
    }
  }

  return plugins.concat(otherPlugins);
}

export function getRules(): Array<RuleSetRule> {
  return [
    {
      oneOf: [
        {
          test: /\.s[ac]ss$/i,
          use: [require.resolve('sass-loader')],
          type: 'css',
        },
        {
          test: /\.css$/i,
          use: [require.resolve('sass-loader')],
          type: 'css',
        },
        {
          test: /\.codegen$/i,
          use: [require.resolve('parcel-codegen-loader')],
        },
        {
          // Exclude `js` files to keep "css" loader working as it injects
          // its runtime that would otherwise be processed through "file" loader.
          // Also exclude `html` and `json` extensions so they get processed
          // by rspacks internal loaders.
          exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/i, /\.html$/i, /\.json$/i],
          type: 'asset',
        },
        // Don't add new loaders here -> should be added before the last (catch-all) handler
      ],
    },
  ];
}
