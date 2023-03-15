import * as SystemJSPublicPathWebpackPlugin from 'systemjs-webpack-interop/SystemJSPublicPathWebpackPlugin';
import { join } from 'path';
import type { SharedDependency } from 'piral-cli';
import { Configuration } from '@rspack/core';

function getDependencies(importmap: Array<SharedDependency>, compilerOptions: Configuration) {
  const dependencies = {};
  const { entry, externals } = compilerOptions;

  if (typeof entry === 'object' && entry && Array.isArray(externals) && typeof externals[0] === 'object') {
    for (const dep of importmap) {
      dependencies[dep.id] = dep.ref;
      externals[0][dep.name] = dep.requireId;

      if (dep.type === 'local') {
        entry[dep.ref.replace(/\.js$/, '')] = dep.entry;
      }
    }
  }

  return dependencies;
}

function withSetPath(compilerOptions: Configuration) {
  if (typeof compilerOptions.entry === 'object' && compilerOptions.entry) {
    const setPath = join(__dirname, '..', '..', 'set-path');

    if (Array.isArray(compilerOptions.entry)) {
      compilerOptions.entry.unshift(setPath);
    } else {
      for (const key of Object.keys(compilerOptions.entry)) {
        const entry = compilerOptions.entry[key];

        if (Array.isArray(entry)) {
          entry.unshift(setPath);
        }
      }
    }
  }
}

function withExternals(compilerOptions: Configuration, externals: Array<string>) {
  const current = compilerOptions.externals || [];
  const arrayExternals = Array.isArray(current) ? current : [current];

  const objectExternal = externals.reduce((external, dep) => {
    external[dep] = dep;
    return external;
  }, {});

  arrayExternals.forEach(external => {
    if (typeof external === 'object' && Object.keys(external).length) {
      for (const dep in external) {
        objectExternal[dep] = external[dep];
      }
    }
  });

  compilerOptions.externals = objectExternal;
}

export interface PiletConfigEnhancerOptions {
  /**
   * The name of the pilet.
   */
  name: string;
  /**
   * The name of the entry module.
   */
  entry: string;
  /**
   * The version of the pilet.
   */
  version: string;
  /**
   * The name of the Piral instances.
   */
  piralInstances: Array<string>;
  /**
   * The name of the main output file.
   */
  filename: string;
  /**
   * The schema version. By default, v1 is used.
   */
  schema?: 'v0' | 'v1' | 'v2' | 'none';
  /**
   * The shared dependencies. By default, these are read from the
   * Piral instance.
   */
  externals?: Array<string>;
  /**
   * Additional environment variables to define.
   */
  variables?: Record<string, string>;
  /**
   * The shared dependencies to consider.
   */
  importmap: Array<SharedDependency>;
}

interface SchemaEnhancerOptions {
  name: string;
  entry: string;
  file: string;
  externals: Array<string>;
  importmap: Array<SharedDependency>;
}

function piletVxWebpackConfigEnhancer(options: SchemaEnhancerOptions, compiler: Configuration) {
  const { externals } = options;

  withSetPath(compiler);
  withExternals(compiler, externals);

  return compiler;
}

function piletV0WebpackConfigEnhancer(options: SchemaEnhancerOptions, compiler: Configuration) {
  const { name, externals, file } = options;
  const shortName = name.replace(/\W/gi, '');
  const jsonpFunction = `pr_${shortName}`;
  // const banner = `//@pilet v:0`;

  withSetPath(compiler);
  withExternals(compiler, externals);

  // compiler.plugins.push(
  //   new BannerPlugin({
  //     banner,
  //     entryOnly: true,
  //     include: file,
  //     raw: true,
  //   }),
  // );
  compiler.output.uniqueName = `${jsonpFunction}`;
  compiler.output.library = { name, type: 'umd' };

  return compiler;
}

function piletV1WebpackConfigEnhancer(options: SchemaEnhancerOptions, compiler: Configuration) {
  const { name, externals, file } = options;
  const shortName = name.replace(/\W/gi, '');
  const jsonpFunction = `pr_${shortName}`;
  // const banner = `//@pilet v:1(${jsonpFunction})`;

  withSetPath(compiler);
  withExternals(compiler, externals);

  // compiler.plugins.push(
  //   new BannerPlugin({
  //     banner,
  //     entryOnly: true,
  //     include: file,
  //     raw: true,
  //   }),
  // );
  compiler.output.uniqueName = `${jsonpFunction}`;
  compiler.output.library = { name, type: 'umd' };
  compiler.output.auxiliaryComment = {
    commonjs2: `\nfunction define(d,k){(typeof document!=='undefined')&&(document.currentScript.app=k.apply(null,d.map(window.${jsonpFunction})));}define.amd=!0;`,
  };

  return compiler;
}

function piletV2WebpackConfigEnhancer(options: SchemaEnhancerOptions, compiler: Configuration) {
  const { name, externals, file, importmap } = options;
  const shortName = name.replace(/\W/gi, '');
  const jsonpFunction = `pr_${shortName}`;
  const plugins = [];

  withExternals(compiler, externals);

  // const dependencies = getDependencies(importmap, compiler);
  // const banner = `//@pilet v:2(webpackChunk${jsonpFunction},${JSON.stringify(dependencies)})`;

  plugins.push(
    // new BannerPlugin({
    //   banner,
    //   entryOnly: true,
    //   include: file,
    //   raw: true,
    // }),
    new SystemJSPublicPathWebpackPlugin(),
  );

  compiler.plugins = [...compiler.plugins, ...plugins];
  compiler.output.uniqueName = `${jsonpFunction}`;
  compiler.output.library = { type: 'system' };

  return compiler;
}

export const piletConfigEnhancer = (details: PiletConfigEnhancerOptions) => (compiler: Configuration) => {
  const { externals = [], schema, importmap } = details;
  const options: SchemaEnhancerOptions = {
    entry: details.entry,
    externals,
    file: details.filename,
    name: details.name,
    importmap,
  };

  switch (schema) {
    case 'v0':
      return piletV0WebpackConfigEnhancer(options, compiler);
    case 'v1':
      return piletV1WebpackConfigEnhancer(options, compiler);
    case 'v2':
      return piletV2WebpackConfigEnhancer(options, compiler);
    case 'none':
    default:
      return piletVxWebpackConfigEnhancer(options, compiler);
  }
};
