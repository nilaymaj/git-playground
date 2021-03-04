import { createIndexFromGitTree } from '../../git-repository/index-file';
import { readObject } from '../../git-repository/object-storage';
import { GitObjectAddress } from '../../git-repository/object-storage/types';
import { serializeGitTree } from '../../git-repository/object-storage/utils';
import { updateRefAt } from '../../git-repository/ref-storage';
import { convertTree } from '../../utils/tree';
import { Operation } from '../types';

/**
 * Resets the current HEAD and head ref to the target commit provided.
 * Depending on reset mode, also resets the index file and file system.
 *
 * Returns success status of the operation.
 */
export const reset: Operation<Args, Result> = (system, args) => {
  const { objectStorage, refStorage, head } = system.repository;

  // Get the commit and work tree objects
  const commit = readObject(objectStorage, args.target);
  if (!commit || commit.type !== 'commit') return false;
  const tree = readObject(objectStorage, commit.workTree);
  if (!tree || tree.type !== 'tree') return false;

  // Update HEAD to the target commit
  if (head.isDetached) head.destination = args.target;
  else updateRefAt(refStorage, head.destination, args.target);
  if (args.mode === 'soft') return true;

  // Mixed/Hard: reset index file
  const newIndexFile = createIndexFromGitTree(commit.workTree, objectStorage);
  if (!newIndexFile) throw new Error('Something is terribly wrong.');
  system.repository.indexFile = newIndexFile;
  if (args.mode === 'mixed') return true;

  // Hard: reset file system
  const serializedTree = serializeGitTree(commit.workTree, objectStorage);
  if (!serializedTree) throw new Error('Something is terribly wrong.');
  const newFileSystem = convertTree(serializedTree, (gb) => gb.fileData);
  system.fileSystem = newFileSystem;
  return true;
};

type Args = {
  /**
   * Reset mode: decides extent of reset
   */
  mode: 'soft' | 'mixed' | 'head';

  /**
   * Hash of target commit to reset to
   */
  target: GitObjectAddress;
};

type Result = boolean;
