import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { getPathString, parsePathString } from '../../utils/path-utils';
import { errorState, successState } from '../utils';

interface MkdirOptions extends CommandOptionsProfile {}

const mkdirOptions: CommandOptions<MkdirOptions> = {};

/**
 * Creates new empty directory at specified paths, similar to UNIX `mkdir`
 */
const mkdirCommand: Command<MkdirOptions> = {
  name: 'mkdir',
  options: mkdirOptions,

  execute: (system, print, _opts, args) => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      // No paths provided
      print('missing path operand');
      return errorState(system);
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      // Check if path is valid
      const pathDepth = currentFS.getPathDepth(path);
      if (pathDepth !== 3) {
        print(`'${getPathString(path)}': invalid path`);
        return errorState(system, currentFS);
      }
      // Execute `mkdir` for this path
      const newFS = currentFS.create(path, 'directory');
      currentFS = newFS;
    }

    return successState(system, currentFS);
  },
};

export default mkdirCommand;
