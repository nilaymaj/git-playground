import { v4 as uuid } from 'uuid';
import { getNodeAt, isLeafNode } from '../utils/tree';
import { FileSystem, FileBlob, FileSystemPath, FileSystemNode } from './types';

/**
 * Generates new file blob with unique "contents"
 *
 * @param {string} [token] Sets unique content token to provided string. Use ONLY for testing purposes.
 */
export const generateFileBlob = (token?: string): FileBlob => ({
  lastModified: new Date(),
  contents: {
    contentToken: token || uuid(),
    version: 0,
  },
});

/**
 * Creates a new blank file system
 */
export const createFileSystem = (): FileSystem => {
  return new Map();
};

/**
 * Returns file/directory at given path in file system.
 * Invalid path returns null. Empty path returns root directory.
 */
export const getItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystemNode | null => {
  return getNodeAt(fileSystem, path);
};

/**
 * Creates a new file at given path in file system.
 * Returns true on success, false if path invalid.
 *
 * Does NOT create any intermediate directories.
 */
export const createItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath,
  type: 'file' | 'directory'
): boolean => {
  if (path.length === 0) return false;
  // Follow path to get nesting directory
  const directory = getItemAt(fileSystem, path.slice(0, -1));
  if (!directory || isLeafNode(directory)) return false;
  // Check if item with same name already exists
  const itemName = path[path.length - 1];
  if (directory.has(itemName)) return false;
  // Add new file to file system
  const item = type === 'file' ? generateFileBlob() : new Map();
  directory.set(itemName, item);
  return true;
};

/**
 * Deletes file/directory at given path in file system.
 * Returns true on success, false if path invalid.
 */
export const deleteItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): boolean => {
  if (path.length === 0) return false;
  // Follow path to get nesting directory
  const directory = getItemAt(fileSystem, path.slice(0, -1));
  if (!directory || isLeafNode(directory)) return false;
  // Delete item and return success status
  const itemName = path[path.length - 1];
  return directory.delete(itemName);
};

/**
 * Bump file version at given path in file system.
 * Returns true on success, false if path invalid.
 */
export const bumpFileVersionAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): boolean => {
  if (path.length === 0) return false;
  const file = getItemAt(fileSystem, path);
  if (!file || !isLeafNode(file)) return false;
  file.contents.version += 1;
  return true;
};
