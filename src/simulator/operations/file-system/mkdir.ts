import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { parsePathString } from '../../utils/path-utils';
import { errorState, successState } from '../utils';

interface MkdirOptions extends CommandOptionsProfile {}

const mkdirOptions: CommandOptions<MkdirOptions> = {};

/**
 * Creates new empty directory at specified paths, similar to UNIX `mkdir`
 */
const mkdirCommand: Command<MkdirOptions> = {
  name: 'mkdir',
  options: mkdirOptions,

  execute: (system, print, opts, args) => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      // No paths provided
      print('missing path operand');
      return errorState(system);
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      // Execute `mkdir` for this path
      const newFS = currentFS.create(path, 'directory');
      if (!newFS) {
        print(`'${path}': no such file or directory`);
        return errorState(system, currentFS);
      }
      currentFS = newFS;
    }

    return successState(system, currentFS);
  },
};

export default mkdirCommand;
