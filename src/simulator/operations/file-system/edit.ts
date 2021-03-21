import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { getPathString, parsePathString } from '../../utils/path-utils';
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
      // Check if the node exists
      const nodeDepth = currentFS.getPathDepth(path);
      if (nodeDepth !== 2) {
        print(`'${getPathString(path)}': invalid path`);
        return errorState(system, currentFS);
      }
      // Bump file at current path
      const newFS = currentFS.bumpFileVersion(path);
      currentFS = newFS;
    }

    return successState(system, currentFS);
  },
};

export default editCommand;
