import { Configuration, Entry } from '@rspack/core';
import HtmlPlugin, { Options } from '@rspack/plugin-html';
import { load } from 'cheerio';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';

export function isLocal(path: string) {
  if (path) {
    if (path.startsWith(':')) {
      return false;
    } else if (path.startsWith('http:')) {
      return false;
    } else if (path.startsWith('https:')) {
      return false;
    } else if (path.startsWith('data:')) {
      return false;
    }

    return true;
  }

  return false;
}

export function extractParts(content: cheerio.Root) {
  const sheets = content('link[href][rel=stylesheet]')
    .filter((_, e: cheerio.TagElement) => isLocal(e.attribs.href))
    .remove()
    .toArray() as Array<cheerio.TagElement>;
  const scripts = content('script[src]')
    .filter((_, e: cheerio.TagElement) => isLocal(e.attribs.src))
    .remove()
    .toArray() as Array<cheerio.TagElement>;
  const files: Array<string> = [];

  for (const sheet of sheets) {
    files.push(sheet.attribs.href);
  }

  for (const script of scripts) {
    files.push(script.attribs.src);
  }

  return files;
}

export function getTemplates(entry: Entry): Array<string> {
  if (typeof entry === 'string' && entry.endsWith('.html')) {
    return [entry];
  } else if (Array.isArray(entry)) {
    return entry.filter((e) => e.endsWith('.html'));
  } else if (typeof entry !== 'function') {
    return Object.values(entry).flatMap((value) => getTemplates(value as Entry));
  }

  return [];
}

export function replaceEntries(existingEntries: Array<string>, oldEntry: string, newEntries: Array<string>) {
  for (let i = 0; i < existingEntries.length; i++) {
    if (existingEntries[i] === oldEntry) {
      existingEntries.splice(i, 1, ...newEntries);
      break;
    }
  }
}

export function setEntries(config: Configuration, template: string, entries: [string, ...Array<string>]) {
  if (typeof config.entry === 'string') {
    config.entry = entries;
  } else if (Array.isArray(config.entry)) {
    replaceEntries(config.entry, template, entries);
  } else if (typeof config.entry !== 'function') {
    Object.keys(config.entry).forEach((key) => {
      const value = config.entry[key];

      if (value === template) {
        config.entry[key] = entries;
      } else if (Array.isArray(value)) {
        replaceEntries(value, template, entries);
      }
    });
  }
}

export interface Html5EntryWebpackPluginOptions extends Omit<Options, 'templateContent'> {}

export const html5EntryConfigEnhancer =
  (options: Html5EntryWebpackPluginOptions) => (compilerOptions: Configuration) => {
    const entry = compilerOptions.entry;
    const [template] = getTemplates(entry);

    if (template) {
      const src = dirname(template);
      const html = readFileSync(template, 'utf8');
      const templateContent = load(
        // try to replace ejs tags, if any
        html.replace(/<%=([\w\W]*?)%>/g, function (match, group) {
          try {
            return eval(group);
          } catch {
            return match;
          }
        }),
      );
      const entries = extractParts(templateContent).map((entry) => join(src, entry));
      const plugins = [
        new HtmlPlugin({
          ...options,
          templateContent: templateContent.html(),
        }),
      ];

      if (!entries.length) throw new Error('Template entries expected to be not empty');

      setEntries(compilerOptions, template, entries as [string, ...Array<string>]);

      compilerOptions.plugins = [...compilerOptions.plugins, ...plugins];
    }

    return compilerOptions;
  };
