import FileSystem, { FileSystemPath } from '../../file-system';
import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
} from '../types';
import Tree from '../../utils/tree';
import { parsePathString } from '../../utils/path-utils';
import { SandboxState } from '../../types';
import { errorState, successState } from '../utils';

interface MvOptions extends CommandOptionsProfile {}

const mvOptions: CommandOptions<MvOptions> = {};

/**
 * Single-source format of UNIX `mv` command.
 * Moves single source to destination path.
 * If destination path is directory, moves to under the directory.
 */
const moveTo = (
  system: SandboxState,
  args: MvToArgs,
  print: (text: string) => void
): CommandExecReturn => {
  const srcItemName = args.srcPath[args.srcPath.length - 1];
  const destParent = system.fileSystem.get(args.destPath.slice(0, -1));
  const destNode = system.fileSystem.get(args.destPath);
  let fullDestPath = args.destPath;
  if (!destParent || Tree.isLeafNode(destParent)) {
    // Invalid destination path
    print('destination path does not exist');
    return errorState(system);
  } else if (destNode && !Tree.isLeafNode(destNode)) {
    // Provided destination is dir, add src item name to get full path
    fullDestPath = [...args.destPath, srcItemName];
  }

  const newFS = system.fileSystem.move(args.srcPath, fullDestPath);
  if (!newFS) {
    print('unknown error occured');
    return errorState(system);
  }

  return successState(system, newFS);
};

/**
 * Multiple-source format of UNIX `mv` command.
 * Moves source items to under destination directory.
 */
const moveUnder = (
  system: SandboxState,
  args: MvUnderArgs,
  print: (text: string) => void
): CommandExecReturn => {
  // Ensure that the destination path is a directory
  const destDir = system.fileSystem.get(args.destDirPath);
  if (!FileSystem.isDirectory(destDir)) {
    print(`destination '${args.destDirPath}' is not a directory`);
    return errorState(system);
  }

  // Move each item to the destination directory
  let currentFS = system.fileSystem;
  for (const srcPath of args.srcPaths) {
    // 1. Validate the source path
    const srcItem = currentFS.get(srcPath);
    if (srcPath.length === 0 || !srcItem) {
      print(`'${srcPath}': no such file or directory`);
      return errorState(system, currentFS);
    }

    // 2. Copy source to destination
    const fullDestPath = [...args.destDirPath, srcPath[srcPath.length - 1]];
    const newFS = currentFS.move(srcPath, fullDestPath);
    if (!newFS) {
      print('an unknown error occured');
      return errorState(system, currentFS);
    }
    currentFS = newFS;
  }

  return successState(system, currentFS);
};

/**
 * Check paths and execute the correct form
 * of move command (single-source or multi-source).
 */
const pickAndExecute = (
  system: SandboxState,
  paths: FileSystemPath[],
  print: (text: string) => void
): CommandExecReturn => {
  if (paths.length === 2) {
    // Single-source move
    const args = { srcPath: paths[0], destPath: paths[1] };
    return moveTo(system, args, print);
  } else {
    // Multiple-source move
    const srcPaths = paths.slice(0, -1);
    const destDirPath = paths[paths.length - 1];
    return moveUnder(system, { srcPaths, destDirPath }, print);
  }
};

/**
 * Copies files/directories at specified source paths
 * to the specified destination path. Similar to UNIX `cp`.
 */
const mvCommand: Command<MvOptions> = {
  name: 'mv',
  options: mvOptions,

  execute: (system, print, _opts, args) => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      print('no file paths provided');
      return { system, success: false };
    } else if (paths.length === 1) {
      print('missing destination path');
      return { system, success: false };
    } else return pickAndExecute(system, paths, print);
  },
};

export default mvCommand;

type MvToArgs = {
  srcPath: FileSystemPath;
  destPath: FileSystemPath;
};

type MvUnderArgs = {
  srcPaths: FileSystemPath[];
  destDirPath: FileSystemPath;
};
