import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { IndexTree } from '../../git-repository/index-file/create-index-tree';
import {
  GitObjectAddress,
  GitTree,
} from '../../git-repository/object-storage/types';
import Tree from '../../utils/tree';
import { getHeadCommit, updateHead } from '../../git-repository/utils';
import { errorState, successState } from '../utils';
import ObjectStorage from '../../git-repository/object-storage';

interface GitCommitOptions extends CommandOptionsProfile {
  message: 'single';
}

const gitCommitOptions: CommandOptions<GitCommitOptions> = {
  message: {
    shortLetter: 'm',
    description: 'commit message',
    valueType: 'single',
  },
};

/**
 * Given an index tree, creates a Git work tree, registers it
 * in object storage and returns the hash address.
 */
const createWorkTreeFromIndex = (
  indexTree: IndexTree,
  objectStorage: ObjectStorage
): { storage: ObjectStorage; hash: GitObjectAddress } => {
  const children = [...indexTree._tree.entries()];
  const treeItems = new Map<string, GitObjectAddress>();

  let currentStorage = objectStorage;
  for (const child of children) {
    if (Tree.isLeafNode(child[1])) {
      // Leaf node: directly add to work tree
      treeItems.set(child[0], child[1].objectHash);
    } else {
      // Sub-tree: recursively create subtree and add to main tree
      const { storage: newStorage, hash } = createWorkTreeFromIndex(
        new Tree(child[1]),
        objectStorage
      );
      treeItems.set(child[0], hash);
      currentStorage = newStorage;
    }
  }

  // Register tree to object storage and return hash
  const gitTree: GitTree = { type: 'tree', items: treeItems };
  return currentStorage.write(gitTree);
};

/**
 * Commits the current index snapshot to the repository,
 * updating HEAD to the new commit. Fails if the index snapshot
 * does not resolve to a valid work tree.
 */
const gitCommitCommand: Command<GitCommitOptions> = {
  name: 'git-commit',
  options: gitCommitOptions,

  execute: (system, print, opts, _args) => {
    // Parse options to get commit message
    if (!opts.message) {
      print('missing commit message');
      return errorState(system);
    }
    const commitMessage = opts.message;
    const { indexFile, objectStorage, refStorage } = system.repository;

    try {
      // Create Git work tree from current index snapshot
      const indexTree = indexFile.toTree();
      const { storage: tempStorage, hash: treeHash } = createWorkTreeFromIndex(
        indexTree,
        objectStorage
      );
      // Create new commit object
      const parentCommit = getHeadCommit(system.repository.head, refStorage);
      const { storage, hash: commitHash } = tempStorage.write({
        type: 'commit',
        timestamp: new Date(),
        workTree: treeHash,
        message: commitMessage,
        parent: parentCommit,
      });

      // Update HEAD and refs
      const newRefStorage = updateHead(
        system.repository.head,
        refStorage,
        commitHash
      );
      if (!newRefStorage) throw new Error(`This shouldn't happen.`);
      const newHead = { ...system.repository.head };

      return successState(system, null, storage, null, newHead, newRefStorage);
    } catch {
      // Point of error: call to `createIndexTree`
      print(`invvalid index tree`);
      return errorState(system);
    }
  },
};

export default gitCommitCommand;
