import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
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
import { SandboxState } from '../../types';
import { errorState, successState } from '../utils';

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
 * Commits the current index snapshot to the repository,
 * updating HEAD to the new commit. Fails if the index snapshot
 * does not resolve to a valid work tree.
 */
export default class GitCommitCommand implements Command<GitCommitOptions> {
  name = 'git-commit';
  options = gitCommitOptions;

  parse = (
    opts: CommandOptionValues<GitCommitOptions>,
    print: (text: string) => void
  ): string | null => {
    if (!opts.message) {
      print('missing commit message');
      return null;
    } else return opts.message;
  };

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    opts: CommandOptionValues<GitCommitOptions>,
    _args: string[]
  ): CommandExecReturn => {
    // Parse options to get commit message
    if (!opts.message) {
      print('missing commit message');
      return errorState(system);
    }
    const commitMessage = opts.message;
    const { indexFile, objectStorage, refStorage } = system.repository;

    try {
      // Create Git work tree from current index snapshot
      const indexTree = createIndexTree(indexFile);
      const { storage: tempStorage, hash: treeHash } = createWorkTreeFromIndex(
        indexTree,
        objectStorage
      );
      // Create new commit object
      const parentCommit = getHeadCommit(system.repository.head, refStorage);
      const { storage, hash: commitHash } = writeObject(tempStorage, {
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
  };
}

/**
 * Given an index tree, creates a Git work tree, registers it
 * in object storage and returns the hash address.
 */
const createWorkTreeFromIndex = (
  indexTree: IndexTree,
  objectStorage: GitObjectStorage
): { storage: GitObjectStorage; hash: GitObjectAddress } => {
  const children = Array.from(indexTree);
  const treeItems = new Map<string, GitObjectAddress>();

  let currentStorage = objectStorage;
  for (const child of children) {
    if (isLeafNode(child[1])) {
      // Leaf node: directly add to work tree
      treeItems.set(child[0], child[1].objectHash);
    } else {
      // Sub-tree: recursively create subtree and add to main tree
      const { storage: newStorage, hash } = createWorkTreeFromIndex(
        child[1],
        objectStorage
      );
      treeItems.set(child[0], hash);
      currentStorage = newStorage;
    }
  }

  // Register tree to object storage and return hash
  const gitTree: GitTree = { type: 'tree', items: treeItems };
  return writeObject(currentStorage, gitTree);
};
