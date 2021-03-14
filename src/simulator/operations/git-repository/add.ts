import { getItemAt } from '../../file-system';
import {
  createEmptyIndex,
  createIndexFromFileTree,
  getPathSection,
  overwriteSection,
} from '../../git-repository/index-file';
import { SandboxState } from '../../types';
import { parsePathString } from '../../utils/path-utils';
import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { errorState, successState } from '../utils';

interface GitAddOptions extends CommandOptionsProfile {}

const gitAddOptions: CommandOptions<GitAddOptions> = {};

/**
 * Adds a list of paths to the index. For paths leading to directories,
 * adds all files inside the directory to index.
 */
export default class GitAddCommand implements Command<GitAddOptions> {
  name = 'git-add';
  options = gitAddOptions;

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    _opts: CommandOptionValues<GitAddOptions>,
    args: string[]
  ): CommandExecReturn => {
    const { fileSystem } = system;
    const { objectStorage, indexFile } = system.repository;

    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      print('missing path operand');
      return { system, success: false };
    }

    let currentIndex = indexFile;
    let currentObjectStorage = objectStorage;
    for (const path of paths) {
      const fsItem = getItemAt(fileSystem, path);
      const indexSection = getPathSection(indexFile, path);

      if (!fsItem) {
        // No file/directory exists at specified path
        // 1. If it does not exist in index file either, path is invalid
        if (indexSection.start === indexSection.end) {
          print(`pathspec '${path}' did not match any files`);
          return errorState(system, null, currentObjectStorage, currentIndex);
        }
        // 2. Else, path corresponds to deleted items
        const newIndex = overwriteSection(indexFile, path, createEmptyIndex());
        if (!newIndex) throw new Error(`This shouldn't happen.`);
        currentIndex = newIndex;
      } else {
        // File/directory exists: create subindex and overwrite main index
        const {
          storage: newStorage,
          indexFile: subIndex,
        } = createIndexFromFileTree(fsItem, objectStorage, path);
        const newIndex = overwriteSection(indexFile, path, subIndex);
        if (!newIndex) throw new Error(`This shouldn't happen.`);
        currentIndex = newIndex;
        currentObjectStorage = newStorage;
      }
    }

    return successState(system, null, currentObjectStorage, currentIndex);
  };
}
