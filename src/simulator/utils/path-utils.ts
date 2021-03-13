import { FileSystemPath } from '../file-system/types';

/**
 * Checks if a path is a prefix of another path, including if both
 * paths are identical. Returns `true` if is prefix.
 */
export const isPrefix = (fullPath: FileSystemPath, prefix: FileSystemPath) => {
  if (fullPath.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; ++i) {
    if (fullPath[i] === prefix[i]) continue;
    return false;
  }
  return true;
};

/**
 * Parses a string into the file system path it represents
 */
export const parsePathString = (pathString: string): FileSystemPath => {
  const segments = pathString.split('/');
  return segments;
};
