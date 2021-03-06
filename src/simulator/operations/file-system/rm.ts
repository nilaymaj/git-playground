import { FileSystemPath } from '../../file-system/types';

import { Operation } from '../types';
import { deleteItemAt } from '../../file-system/index';

type Args = {
  paths: FileSystemPath[];
};

type Result = boolean[];

/**
 * Removes files/directories at specified paths, similar to UNIX `rmdir`.
 * Returns boolean array denoting success state of each `rmdir` operation.
 */
export const rm: Operation<Args, Result> = (system, args) => {
  return args.paths.map((path) => deleteItemAt(system.fileSystem, path));
};
