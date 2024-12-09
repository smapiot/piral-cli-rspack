import { Configuration, RuleSetRule, CssExtractRspackPlugin, Plugin } from '@rspack/core';

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

export function getPlugins(plugins: Array<Plugin>, pilet?: string) {
  const otherPlugins: Array<Plugin> = [
    new CssExtractRspackPlugin({
      filename: pilet ? piletCss : '[name].[fullhash:6].css',
      chunkFilename: '[id].[chunkhash:6].css',
    }),
  ];

  return plugins.concat(otherPlugins);
}

export function getRules(): Array<RuleSetRule> {
  return [
    {
      oneOf: [
        {
          test: /\.js$/,
          exclude: [/node_modules/],
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
              },
            },
          },
          type: 'javascript/auto',
        },
        {
          test: /\.ts$/,
          exclude: [/node_modules/],
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
            },
          },
          type: 'javascript/auto',
        },
        {
          test: /\.jsx$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                },
              },
            },
          },
          type: 'javascript/auto',
        },
        {
          test: /\.tsx$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  jsx: true,
                },
              },
            },
          },
          type: 'javascript/auto',
        },
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
          type: 'asset/resource',
        },
        // Don't add new loaders here -> should be added before the last (catch-all) handler
      ],
    },
  ];
}
