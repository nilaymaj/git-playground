import { FileSystemPath } from '../../file-system/types';
import {
  Command,
  CommandExecReturn,
  CommandOptions,
  CommandOptionsProfile,
  CommandOptionValues,
} from '../types';
import { getItemAt, moveItem } from '../../file-system';
import { isLeafNode } from '../../utils/tree';
import { parsePathString } from '../../utils/path-utils';
import { SandboxState } from '../../types';

interface CpOptions extends CommandOptionsProfile {}

const cpOptions: CommandOptions<CpOptions> = {};

/**
 * Copies files/directories at specified source paths
 * to the specified destination path. Similar to UNIX `cp`.
 */
export default class CpCommand implements Command<CpOptions> {
  name = 'cp';
  options = cpOptions;

  pickAndExecute = (
    system: SandboxState,
    paths: FileSystemPath[],
    print: (text: string) => void
  ): CommandExecReturn => {
    if (paths.length === 2) {
      // Single-source copy
      const args = { srcPath: paths[0], destPath: paths[1] };
      return this.copyTo(system, args, print);
    } else {
      // Multiple-source copy
      const srcPaths = paths.slice(0, -1);
      const destDirPath = paths[paths.length - 1];
      return this.copyUnder(system, { srcPaths, destDirPath }, print);
    }
  };

  execute = (
    system: SandboxState,
    print: (text: string) => void,
    _opts: CommandOptionValues<CpOptions>,
    args: string[]
  ) => {
    const paths = args.map(parsePathString);
    if (paths.length === 0) {
      print('no file paths provided');
      return { system, success: false };
    } else if (paths.length === 1) {
      print('missing destination path');
      return { system, success: false };
    } else return this.pickAndExecute(system, paths, print);
  };

  /**
   * Single-source format of UNIX `cp` command.
   * Copies single source to destination path.
   * If destination path is directory, copies to under the directory.
   */
  copyTo = (
    system: SandboxState,
    args: CpToArgs,
    print: (text: string) => void
  ): CommandExecReturn => {
    const srcItemName = args.srcPath[args.srcPath.length - 1];
    const destParent = getItemAt(system.fileSystem, args.destPath.slice(0, -1));
    const destNode = getItemAt(system.fileSystem, args.destPath);
    let fullDestPath = args.destPath;
    if (!destParent || isLeafNode(destParent)) {
      // Invalid destination path
      print('destination path does not exist');
      return { system, success: false };
    } else if (destNode && !isLeafNode(destNode)) {
      // Provided destination is dir, add src item name to get full path
      fullDestPath = [...args.destPath, srcItemName];
    }

    const newFS = moveItem(system.fileSystem, args.srcPath, fullDestPath, true);
    if (!newFS) {
      print('unknown error occured');
      return { system, success: false };
    }

    return { system: { ...system, fileSystem: newFS }, success: true };
  };

  /**
   * Multiple-source format of UNIX `cp` command.
   * Copies source items to under destination directory.
   */
  copyUnder = (
    system: SandboxState,
    args: CpUnderArgs,
    print: (text: string) => void
  ): CommandExecReturn => {
    // Ensure that the destination path is a directory
    const destDir = getItemAt(system.fileSystem, args.destDirPath);
    if (!destDir || !isLeafNode(destDir)) {
      print(`destination '${args.destDirPath}' is not a directory`);
      return { system, success: false };
    }

    // Move each item to the destination directory
    let currentFS = system.fileSystem;
    for (const srcPath of args.srcPaths) {
      // 1. Validate the source path
      const srcItem = getItemAt(currentFS, srcPath);
      if (srcPath.length === 0 || !srcItem) {
        print(`'${srcPath}': no such file or directory`);
        return { system: { ...system, fileSystem: currentFS }, success: false };
      }

      // 2. Copy source to destination
      const fullDestPath = [...args.destDirPath, srcPath[srcPath.length - 1]];
      const newFS = moveItem(currentFS, srcPath, fullDestPath, true);
      if (!newFS) {
        print('an unknown error occured');
        return { system: { ...system, fileSystem: currentFS }, success: false };
      }
      currentFS = newFS;
    }

    return { system: { ...system, fileSystem: currentFS }, success: true };
  };
}

type CpToArgs = {
  srcPath: FileSystemPath;
  destPath: FileSystemPath;
};

type CpUnderArgs = {
  srcPaths: FileSystemPath[];
  destDirPath: FileSystemPath;
};
