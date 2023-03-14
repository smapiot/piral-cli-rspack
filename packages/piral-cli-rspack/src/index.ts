import * as actions from './actions';
import { CliPlugin } from 'piral-cli';

const plugin: CliPlugin = (cli) => {
  cli.withBundler('rspack', actions);
};

module.exports = plugin;
