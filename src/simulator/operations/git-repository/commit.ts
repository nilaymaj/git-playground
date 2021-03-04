import { Operation } from '../types';
import {
  createIndexTree,
  IndexTree,
} from '../../git-repository/index-file/create-index-tree';
import {
  GitObjectAddress,
  GitObjectStorage,
  GitTree,
} from '../../git-repository/object-storage/types';
import { isLeafNode } from '../../utils/tree';
import { writeObject } from '../../git-repository/object-storage';
import { getHeadCommit, updateHead } from '../../git-repository/utils';

/**
 * Commits the current index snapshot to the repository,
 * updating HEAD to the new commit. Fails if the index snapshot
 * does not resolve to a valid work tree.
 */
export const commit: Operation<Args, Result> = (system, args) => {
  const { indexFile, objectStorage, refStorage } = system.repository;
  try {
    // Create Git work tree from current index snapshot
    const indexTree = createIndexTree(indexFile);
    const treeHash = createWorkTreeFromIndex(indexTree, objectStorage);
    // Create new commit object
    const parentCommit = getHeadCommit(system.repository.head, refStorage);
    const commitHash = writeObject(objectStorage, {
      type: 'commit',
      timestamp: new Date(),
      workTree: treeHash,
      message: args.message,
      parent: parentCommit,
    });
    // Update HEAD
    updateHead(system.repository.head, refStorage, commitHash);
    return true;
  } catch {
    // @todo Improve error handling here
    // Probable point of error: call to `createIndexTree`
    return false;
  }
};

type Args = {
  message: string;
};

type Result = boolean;

/**
 * Given an index tree, creates a Git work tree, registers it
 * in object storage and returns the hash address.
 */
const createWorkTreeFromIndex = (
  indexTree: IndexTree,
  objectStorage: GitObjectStorage
): GitObjectAddress => {
  const children = Array.from(indexTree);
  const treeItems = new Map<string, GitObjectAddress>();

  children.forEach((child) => {
    if (isLeafNode(child[1])) {
      // Leaf node: directly add to work tree
      treeItems.set(child[0], child[1].objectHash);
    } else {
      // Sub-tree: recursively create subtree and add to main tree
      const subTreeHash = createWorkTreeFromIndex(child[1], objectStorage);
      treeItems.set(child[0], subTreeHash);
    }
  });

  // Register tree to object storage and return hash
  const gitTree: GitTree = { type: 'tree', items: treeItems };
  return writeObject(objectStorage, gitTree);
};
