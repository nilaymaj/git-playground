import FileSystem from '../../file-system';
import { createIndexFromGitTree } from '../../git-repository/index-file';
import { readObject } from '../../git-repository/object-storage';
import { serializeGitTree } from '../../git-repository/object-storage/utils';
import { updateHead } from '../../git-repository/utils';
import { SandboxState } from '../../types';
import {
  Command,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
  CommandExecReturn,
} from '../types';
import { errorState, successState } from '../utils';

interface GitResetOptions extends CommandOptionsProfile {
  soft: 'boolean';
  mixed: 'boolean';
  hard: 'boolean';
}

const gitResetOptions: CommandOptions<GitResetOptions> = {
  soft: {
    valueType: 'boolean',
    description: 'does not touch index file or working tree',
  },
  mixed: {
    valueType: 'boolean',
    description: 'resets index but not working tree',
  },
  hard: {
    valueType: 'boolean',
    description: 'resets index and working tree',
  },
};

/**
 * Resets the current HEAD and head ref to the target commit provided.
 * Depending on reset mode, also resets the index file and file system.
 *
 * Returns success status of the operation.
 */
export default class GitResetCommand implements Command<GitResetOptions> {
  name = 'git-reset';
  options = gitResetOptions;

  parse = (args: string[], print: (text: string) => void) => {
    if (args.length === 0) print('missing target commit');
    else if (args.length >= 2) print('too many operands');
    else return args[0];
  };

  getMode = (opts: CommandOptionValues<GitResetOptions>) => {
    if (opts.soft) return 'soft';
    else if (opts.mixed) return 'mixed';
    else if (opts.hard) return 'hard';
    else return 'mixed';
  };

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    opts: CommandOptionValues<GitResetOptions>,
    args: string[]
  ): CommandExecReturn => {
    const { objectStorage, refStorage, head } = system.repository;

    // Parse to get target commit and reset mode
    const targetCommitHash = this.parse(args, print);
    if (!targetCommitHash) return errorState(system);
    const resetMode = this.getMode(opts);

    // Get the commit and work tree objects
    const commit = readObject(objectStorage, targetCommitHash);
    if (!commit || commit.type !== 'commit') {
      print(`'${targetCommitHash.slice(-7)}': invalid commit address`);
      return errorState(system);
    }
    const tree = readObject(objectStorage, commit.workTree);
    if (!tree || tree.type !== 'tree')
      throw new Error('Inconsistent object storage');

    // Update HEAD to the target commit
    const newRefStorage = updateHead(head, refStorage, targetCommitHash);
    if (!newRefStorage) throw new Error('Commit points to invalid ref!');
    const newHead = { ...head };
    if (resetMode === 'soft')
      return successState(system, null, null, null, newHead, newRefStorage);

    // Mixed/Hard: reset index file
    const newIndexFile = createIndexFromGitTree(commit.workTree, objectStorage);
    if (!newIndexFile) throw new Error('Something is terribly wrong.');
    if (resetMode === 'mixed')
      return successState(
        system,
        null,
        null,
        newIndexFile,
        newHead,
        newRefStorage
      );

    // Hard: reset file system
    const serializedTree = serializeGitTree(commit.workTree, objectStorage);
    if (!serializedTree) throw new Error('Something is terribly wrong.');
    const newFileSystem = new FileSystem(
      serializedTree.convert((gb) => gb.fileData)
    );
    return successState(
      system,
      newFileSystem,
      null,
      newIndexFile,
      newHead,
      newRefStorage
    );
  };
}
