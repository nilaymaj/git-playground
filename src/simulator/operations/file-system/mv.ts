import { FileSystemPath } from '../../file-system/types';
import { Operation } from '../types';
import { getItemAt, moveItem } from '../../file-system';
import { isLeafNode } from '../../utils/tree';

type MvToArgs = {
  srcPath: FileSystemPath;
  destPath: FileSystemPath;
};

type MvToResult = boolean;

/**
 * Move a single item to another location. Similar to the single-source
 * format of UNIX `mv` command. Returns success result of `mv` operation.
 */
export const moveTo: Operation<MvToArgs, MvToResult> = (system, args) => {
  return moveItem(system.fileSystem, args.srcPath, args.destPath);
};

type MvUnderArgs = {
  srcPaths: FileSystemPath[];
  destDirPath: FileSystemPath;
};

type MvUnderResult = boolean[];

/**
 * Move one or more items to inside the destination directory. Similar to
 * the multiple-source format of UNIX `mv` command. Returns array of booleans
 * representing success status of each `mv` operation.
 */
export const moveUnder: Operation<MvUnderArgs, MvUnderResult> = (
  system,
  args
) => {
  // Ensure that the destination path is a directory
  const destDir = getItemAt(system.fileSystem, args.destDirPath);
  if (isLeafNode(destDir)) return new Array(args.srcPaths.length).fill(false);

  // Move each item to the destination directory
  return args.srcPaths.map((srcPath) => {
    if (srcPath.length === 0) return false;
    const itemName = srcPath[srcPath.length - 1];
    const destPath = [...args.destDirPath, itemName];
    return moveItem(system.fileSystem, srcPath, destPath);
  });
};
