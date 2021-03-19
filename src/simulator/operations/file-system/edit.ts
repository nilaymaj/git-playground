import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { parsePathString } from '../../utils/path-utils';
import { errorState, successState } from '../utils';

interface EditOptions extends CommandOptionsProfile {}

const editOptions: CommandOptions<EditOptions> = {};

/**
 * Bumps the file version of files at specified paths.
 */
const editCommand: Command<EditOptions> = {
  name: 'edit',
  options: editOptions,

  execute: (system, print, _opts, args) => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      // No paths provided
      print('missing path operand');
      return errorState(system);
    }

    let currentFS = system.fileSystem;
    for (const path of paths) {
      // Bump file at current path
      const newFS = currentFS.bumpFileVersion(path);
      if (!newFS) {
        print(`'path' is not a file`);
        return errorState(system, currentFS);
      }
      currentFS = newFS;
    }

    return successState(system, currentFS);
  },
};

export default editCommand;
