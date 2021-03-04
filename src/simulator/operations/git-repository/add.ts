import { getItemAt } from '../../file-system';
import { FileSystemPath } from '../../file-system/types';
import {
  createEmptyIndex,
  createIndexFromFileTree,
  getPathSection,
  overwriteSection,
} from '../../git-repository/index-file';
import { Operation } from '../types';

/**
 * Adds a list of paths to the index. For paths leading to directories,
 * adds all files inside the directory to index.
 *
 * Returns a boolean[] representing the success state of each operation.
 * This operation should fail only if the path is invalid.
 */
export const add: Operation<Args, Result> = (system, args) => {
  const { fileSystem } = system;
  const { objectStorage, indexFile } = system.repository;

  return args.paths.map((path) => {
    const fsItem = getItemAt(fileSystem, path);
    const indexSection = getPathSection(indexFile, path);

    // Check if the path represents deleted items
    if (!fsItem) {
      // If it does not exist in index file either, path is invalid
      if (indexSection.start === indexSection.end) return false;
      // Else, path corresponds to deleted items
      overwriteSection(indexFile, path, createEmptyIndex());
      return true;
    }

    const subIndex = createIndexFromFileTree(fsItem, objectStorage, path);
    overwriteSection(indexFile, path, subIndex);
    return true;
  });
};

type Args = {
  paths: FileSystemPath[];
};

type Result = boolean[];
