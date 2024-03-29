import FileSystem from '../../file-system';
import GitHead from '../../git-repository/head';
import IndexFile from '../../git-repository/index-file';
import { GitObjectAddress } from '../../git-repository/object-storage/types';
import { serializeGitTree } from '../../git-repository/object-storage/utils';
import { Apocalypse } from '../../utils/errors';
import { Command, CommandOptions, CommandOptionsProfile } from '../types';
import { errorState, successState } from '../utils';

interface GitCheckoutOptions extends CommandOptionsProfile {}

const gitCheckoutOptions: CommandOptions<GitCheckoutOptions> = {};

/**
 * Parse the arguments to get target commit
 */
const parseArgs = (
  args: string[],
  print: (text: string) => void
): GitObjectAddress | null => {
  if (args.length === 0) {
    // No arguments provided
    print('missing target commit');
    return null;
  } else if (args.length >= 2) {
    // Too many arguments provided
    print('too many operands');
    return null;
  }

  return args[0];
};

/**
 * Given the commit address, checks out a specific commit.
 * Updates file system and index file to commit snapshot.
 */
const gitCheckoutCommand: Command<GitCheckoutOptions> = {
  name: 'git-checkout',
  options: gitCheckoutOptions,

  execute: (system, print, _opts, args) => {
    const { objectStorage } = system.repository;

    // Parse arguments to get commit address
    const commitHash = parseArgs(args, print);
    if (!commitHash) return errorState(system);

    // Get commit object from storage
    const commitObject = objectStorage.read(commitHash);
    if (!commitObject || commitObject.type !== 'commit') {
      print(`'${commitHash}': invalid commit address`);
      return errorState(system);
    }

    // Get corresponding Git work tree and serialize it
    const gitTreeAddress = commitObject.workTree;
    const gitWorkTree = objectStorage.read(gitTreeAddress);
    if (!gitWorkTree || gitWorkTree.type !== 'tree')
      throw new Apocalypse('Commit does not point to valid work tree!');
    const serializedTree = serializeGitTree(gitWorkTree, objectStorage);

    // Create file system from work tree
    const newFileSystem = new FileSystem(
      serializedTree.convert((gitBlob) => gitBlob.fileData)
    );

    // Create index file from work tree
    const newIndexFile = IndexFile.fromGitTree(objectStorage, gitWorkTree);

    // Update HEAD
    const newHead: GitHead = system.repository.head.detachTo(commitHash);

    // Return new system state
    print(`HEAD is now at ${commitHash.slice(-7)}`);
    return successState(system, newFileSystem, null, newIndexFile, newHead);
  },
};

export default gitCheckoutCommand;
