import FileSystem, { FileSystemPath } from '../../file-system';
import {
  Command,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import {
  getPathString,
  isPrefix,
  parsePathString,
} from '../../utils/path-utils';
import { SandboxState } from '../../types';
import { errorState, successState } from '../utils';
import { Apocalypse } from '../../utils/errors';

interface MvOptions extends CommandOptionsProfile {
  recursive: 'boolean';
}

const mvOptions: CommandOptions<MvOptions> = {
  recursive: {
    shortLetter: 'r',
    description: 'copy directories recursively',
    valueType: 'boolean',
  },
};

/**
 * Validate that the source path is a valid path to move from.
 * Pass `noDirectory: true` if source is not allowed to be directory.
 */
const validateSource = (
  fs: FileSystem,
  srcPath: FileSystemPath,
  print: (text: string) => void,
  noDirectory?: boolean
): boolean => {
  const srcPathDepth = fs.getPathDepth(srcPath);
  console.log(srcPathDepth);
  if (srcPathDepth !== 1 && srcPathDepth !== 2) {
    print(`${getPathString(srcPath)}: invalid path`);
    return false;
  } else if (srcPathDepth === 1 && noDirectory) {
    print(`-r not provided: omitting directory'${getPathString(srcPath)}'`);
    return false;
  } else return true;
};

/**
 * Validate that the destination is a valid path to move to.
 * Pass `ensureDir: true` if destination must be directory.
 */
const validateDest = (
  fs: FileSystem,
  destPath: FileSystemPath,
  print: (text: string) => void,
  ensureDir?: boolean
): boolean => {
  const destPathDepth = fs.getPathDepth(destPath);
  if (destPathDepth >= 4) {
    // Parent is leaf or does not exist
    print(`target '${getPathString(destPath)}' is not a directory`);
    return false;
  } else if (ensureDir && destPathDepth >= 2) {
    // `ensureDir = true` but path is not a directory
    print(`target '${getPathString(destPath)}' is not a directory`);
    return false;
  } else return true;
};

/**
 * Handler for the `mv` command.
 * Move provided source items to the destination path.
 */
const moveItems = (
  system: SandboxState,
  paths: FileSystemPath[],
  opts: CommandOptionValues<MvOptions>,
  print: (text: string) => void
) => {
  // `mv` takes atleast 2 arguments
  if (paths.length < 2) {
    print(`insufficient arguments`);
    return errorState(system);
  }

  const srcPaths = paths.slice(0, -1);
  const destPath = paths[paths.length - 1];
  const multiSrc = srcPaths.length > 1;
  const recursive = !!opts.recursive;

  // Validate the destination path - must be directory if multiple sources are provided
  const destValid = validateDest(system.fileSystem, destPath, print, multiSrc);
  if (!destValid) return errorState(system);

  let currentFS = system.fileSystem;
  for (const srcPath of srcPaths) {
    // Validate source path - directories allowed only if recursive flag passed
    const srcValid = validateSource(currentFS, srcPath, print, !recursive);
    if (!srcValid) return errorState(system, currentFS);
    const srcItemName = srcPath[srcPath.length - 1];

    // Create the full destination path
    const destNode = currentFS.get(destPath);
    if (!destNode) throw new Apocalypse(); // (Item-renaming not implemented)
    let fullDest = FileSystem.isFile(destNode)
      ? destPath
      : [...destPath, srcItemName];

    // Ensure destination is not subdir of source
    if (isPrefix(fullDest, srcPath)) {
      const destPathStr = getPathString(fullDest);
      const srcPathStr = getPathString(srcPath);
      if (fullDest.length === srcPath.length)
        print(`'${srcPathStr}' and '${destPathStr}' are the same file`);
      else
        print(
          `cannot move '${srcPathStr}' to a subdirectory of itself, '${destPathStr}'`
        );
      return errorState(system, currentFS);
    }

    const newFS = currentFS.move(srcPath, fullDest);
    currentFS = newFS;
  }

  return successState(system, currentFS);
};

/**
 * Moves files/directories at specified source paths
 * to the specified destination path. Similar to UNIX `mv`.
 */
const mvCommand: Command<MvOptions> = {
  name: 'mv',
  options: mvOptions,

  execute: (system, print, opts, args) => {
    const paths = args.map(parsePathString);
    return moveItems(system, paths, opts, print);
  },
};

export default mvCommand;
