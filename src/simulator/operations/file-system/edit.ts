import { FileSystemPath } from '../../file-system/types';

import { Operation } from '../types';
import { bumpFileVersionAt } from '../../file-system/index';

type Args = {
  paths: FileSystemPath[];
};

type Result = boolean[];

/**
 * Bumps version of files at specified paths, thus updating their "contents".
 * Returns boolean array denoting success state of each version bump.
 */
export const edit: Operation<Args, Result> = (system, args) => {
  return args.paths.map((filePath) =>
    bumpFileVersionAt(system.fileSystem, filePath)
  );
};
