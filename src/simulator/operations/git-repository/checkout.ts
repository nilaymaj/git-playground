import { FileSystem } from '../../file-system';
import { createIndexFromGitTree } from '../../git-repository/index-file';
import { readObject } from '../../git-repository/object-storage';
import { GitObjectAddress } from '../../git-repository/object-storage/types';
import { serializeGitTree } from '../../git-repository/object-storage/utils';
import { GitHead } from '../../git-repository/types';
import { SandboxState } from '../../types';
import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { errorState, successState } from '../utils';

interface GitCheckoutOptions extends CommandOptionsProfile {}

const gitCheckoutOptions: CommandOptions<GitCheckoutOptions> = {};

/**
 * Given the commit address, checks out a specific commit.
 * Updates file system and index file to commit snapshot.
 */
export default class GitCheckoutCommand implements Command<GitCheckoutOptions> {
  name = 'git-checkout';
  options = gitCheckoutOptions;

  parse = (
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

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    opts: CommandOptionValues<GitCheckoutOptions>,
    args: string[]
  ): CommandExecReturn => {
    const { objectStorage } = system.repository;

    // Parse arguments to get commit address
    const commitHash = this.parse(args, print);
    if (!commitHash) return errorState(system);

    // Get commit object from storage
    const commitObject = readObject(objectStorage, commitHash);
    if (!commitObject || commitObject.type !== 'commit') {
      print(`'${commitHash}': invalid commit address`);
      return errorState(system);
    }

    // Get corresponding Git work tree and serialize it
    const gitTreeAddress = commitObject.workTree;
    const serializedTree = serializeGitTree(gitTreeAddress, objectStorage);
    if (!serializedTree) throw new Error('Commit does not point to Git tree!');

    // Create file system from work tree
    const newFileSystem: FileSystem = serializedTree.convert(
      (gitBlob) => gitBlob.fileData
    );

    // Create index file from work tree
    const newIndexFile = createIndexFromGitTree(gitTreeAddress, objectStorage);
    if (!newIndexFile) throw new Error(`This shouldn't happen.`);

    // Update HEAD
    const newHead: GitHead = { isDetached: true, destination: commitHash };

    // Return new system state
    print(`HEAD is now at ${commitHash.slice(-7)}`);
    return successState(system, newFileSystem, null, newIndexFile, newHead);
  };
}
