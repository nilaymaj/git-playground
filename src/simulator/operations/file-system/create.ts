import { FileSystemPath } from '../../file-system/types';

import { Operation } from '../types';
import { createItemAt } from '../../file-system/index';

type Args = {
  paths: FileSystemPath[];
};

type Result = boolean[];

/**
 * Creates new files at specified paths, similar to UNIX `touch`.
 * Returns boolean array denoting success state of each `create` operation.
 */
export const create: Operation<Args, Result> = (system, args) => {
  return args.paths.map((filePath) =>
    createItemAt(system.fileSystem, filePath, 'file')
  );
};
