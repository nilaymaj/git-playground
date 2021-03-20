import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import {
  getParentPath,
  getPathString,
  parsePathString,
} from '../../utils/path-utils';
import { errorState, successState } from '../utils';
import FileSystem, { FileSystemPath } from '../../file-system';

interface CreateOptions extends CommandOptionsProfile {}

const createOptions: CommandOptions<CreateOptions> = {};

/**
 * Execute a single `create` operation on the filesystem.
 */
const createFile = (
  fs: FileSystem,
  print: (text: string) => void,
  path: FileSystemPath
): FileSystem | void => {
  const pathString = getPathString(path);
  if (path.length === 0) return print(`"${pathString}": invalid path`);
  const parentPath = getParentPath(path);
  if (!fs.get(parentPath)) return print(`"${pathString}": invalid path`);
  if (fs.get(path)) return print(`"${pathString}": already exists`);
  return fs.create(path, 'file');
};

/**
 * Create new files at specified paths.
 */
const createCommand: Command<CreateOptions> = {
  name: 'create',
  options: createOptions,

  execute: (system, print, _opts, args) => {
    // Parse arguments into paths.
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      print('no file paths provided');
      return errorState(system);
    }

    // Iterate through arguments and execute each create op.
    let currentFS = system.fileSystem;
    for (const path of paths) {
      const newFS = createFile(currentFS, print, path);
      if (!newFS) return errorState(system, currentFS);
      currentFS = newFS;
    }

    return successState(system, currentFS);
  },
};

export default createCommand;
