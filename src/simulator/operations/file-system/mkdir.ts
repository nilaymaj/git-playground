import { FileSystemPath } from '../../file-system/types';

import { Operation } from '../types';
import { createItemAt } from '../../file-system/index';

type Args = {
  paths: FileSystemPath[];
};

type Result = boolean[];

/**
 * Creates new directories at specified paths, similar to UNIX `mkdir`.
 * Returns boolean array denoting success state of each `mkdir` operation.
 */
export const mkdir: Operation<Args, Result> = (system, args) => {
  return args.paths.map((path) =>
    createItemAt(system.fileSystem, path, 'directory')
  );
};
