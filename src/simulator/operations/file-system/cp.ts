import { FileSystemPath } from '../../file-system';
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

interface CpOptions extends CommandOptionsProfile {}

const cpOptions: CommandOptions<CpOptions> = {};

/**
 * Single-source format of UNIX `cp` command.
 * Copies single source to destination path.
 * If destination path is directory, copies to under the directory.
 */
const copyTo = (
  system: SandboxState,
  args: CpToArgs,
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

  const newFS = system.fileSystem.move(args.srcPath, fullDestPath, true);
  if (!newFS) {
    print('unknown error occured');
    return errorState(system);
  }

  return { system: { ...system, fileSystem: newFS }, success: true };
};

/**
 * Multiple-source format of UNIX `cp` command.
 * Copies source items to under destination directory.
 */
const copyUnder = (
  system: SandboxState,
  args: CpUnderArgs,
  print: (text: string) => void
): CommandExecReturn => {
  // Ensure that the destination path is a directory
  const destDir = system.fileSystem.get(args.destDirPath);
  if (!destDir || !Tree.isLeafNode(destDir)) {
    print(`destination '${args.destDirPath}' is not a directory`);
    return { system, success: false };
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
    const newFS = currentFS.move(srcPath, fullDestPath, true);
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
 * of copy command (single-source or multi-source).
 */
const pickAndExecute = (
  system: SandboxState,
  paths: FileSystemPath[],
  print: (text: string) => void
): CommandExecReturn => {
  if (paths.length === 2) {
    // Single-source copy
    const args = { srcPath: paths[0], destPath: paths[1] };
    return copyTo(system, args, print);
  } else {
    // Multiple-source copy
    const srcPaths = paths.slice(0, -1);
    const destDirPath = paths[paths.length - 1];
    return copyUnder(system, { srcPaths, destDirPath }, print);
  }
};

/**
 * Copies files/directories at specified source paths
 * to the specified destination path. Similar to UNIX `cp`.
 */
const cpCommand: Command<CpOptions> = {
  name: 'cp',
  options: cpOptions,

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

export default cpCommand;

type CpToArgs = {
  srcPath: FileSystemPath;
  destPath: FileSystemPath;
};

type CpUnderArgs = {
  srcPaths: FileSystemPath[];
  destDirPath: FileSystemPath;
};
