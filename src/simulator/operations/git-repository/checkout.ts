import { createIndexFromGitTree } from '../../git-repository/index-file';
import { readObject } from '../../git-repository/object-storage';
import { GitObjectAddress } from '../../git-repository/object-storage/types';
import { serializeGitTree } from '../../git-repository/object-storage/utils';
import { convertTree } from '../../utils/tree';
import { Operation } from '../types';

/**
 * Given the commit address, checks out a specific commit.
 * Updates file system and index file to commit snapshot.
 */
export const checkout: Operation<Args, Result> = (system, args) => {
  const { objectStorage } = system.repository;

  // Get commit object from storage
  const commitObject = readObject(objectStorage, args.commitHash);
  if (!commitObject) return false;
  if (commitObject.type !== 'commit') return false;

  // Get corresponding Git work tree and serialize it
  const gitTreeAddress = commitObject.workTree;
  const serializedTree = serializeGitTree(gitTreeAddress, objectStorage);
  if (!serializedTree) throw new Error('Commit does not point to Git tree!');

  // Create file system from work tree
  const newFileSystem = convertTree(
    serializedTree,
    (gitBlob) => gitBlob.fileData
  );
  system.fileSystem = newFileSystem;

  // Create index file from work tree
  const newIndexFile = createIndexFromGitTree(gitTreeAddress, objectStorage);
  if (!newIndexFile) throw new Error('Something is terribly wrong.');
  system.repository.indexFile = newIndexFile;

  // Update HEAD
  system.repository.head.isDetached = true;
  system.repository.head.destination = args.commitHash;

  return true;
};

export type Args = {
  commitHash: GitObjectAddress;
};

export type Result = boolean;
