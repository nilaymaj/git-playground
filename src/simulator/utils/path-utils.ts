import { FileSystemPath } from '../file-system';

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
  pathString = pathString.trim();
  if (pathString.length === 0) return [];
  const segments = pathString.split('/');
  return segments;
};

/**
 * Convert a FileSystemPath to plain string path.
 */
export const getPathString = (path: FileSystemPath): string => {
  return path.join('/');
};

/**
 * Return the parent path of the specified path.
 */
export const getParentPath = (path: FileSystemPath): FileSystemPath => {
  return path.slice(0, -1);
};
