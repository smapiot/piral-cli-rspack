import { Configuration, RuleSetRule } from "@rspack/core";

const piletCss = 'main.css';

function getStyleLoaders(production: boolean) {
  if (production) {
    return [];
  } else {
    return [require.resolve('style-loader')];
  }
}

export type ConfigEnhancer = (config: Configuration) => Configuration;

export type DefaultConfiguration = [Configuration, ConfigEnhancer];

export const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

export function getVariables(): Record<string, string> {
  return Object.keys(process.env).reduce(
    (prev, curr) => {
      prev[curr] = process.env[curr];
      return prev;
    },
    {
      DEBUG_PIRAL: '',
      DEBUG_PILET: '',
    },
  );
}

export function getPlugins(plugins: Array<any>, production: boolean, pilet?: string) {
  const otherPlugins = [];

  if (production) {
    if (pilet) {
      // const name = process.env.BUILD_PCKG_NAME;
      // otherPlugins.push(new SheetPlugin(piletCss, name, pilet));
    }
  }

  return plugins.concat(otherPlugins);
}

export function getRules(production: boolean): Array<RuleSetRule> {
  const styleLoaders = getStyleLoaders(production);

  return [
    {
      oneOf: [
        {
          test: /\.s[ac]ss$/i,
          use: [...styleLoaders, require.resolve('css-loader'), require.resolve('sass-loader')],
        },
        {
          test: /\.css$/i,
          use: [...styleLoaders, require.resolve('css-loader')],
        },
        {
          test: /\.codegen$/i,
          use: [require.resolve('parcel-codegen-loader')],
        },
        {
          // Exclude `js` files to keep "css" loader working as it injects
          // its runtime that would otherwise be processed through "file" loader.
          // Also exclude `html` and `json` extensions so they get processed
          // by webpacks internal loaders.
          exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/i, /\.html$/i, /\.json$/i],
          type: 'asset',
        },
        // Don't add new loaders here -> should be added before the last (catch-all) handler
      ],
    },
  ];
}
