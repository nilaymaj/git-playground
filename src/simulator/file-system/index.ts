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

/**
 * Move a file/directory from one location to another.
 * Returns success state of operation.
 *
 * - Overwrites existing item at destination path provided.
 * - Removes item at source by default. To disable this, pass `preserveSrc`.
 *
 * @param {FileSystem} fileSystem The file system object
 * @param {FileSystemPath} srcPath Path to the item to be copied
 * @param {FileSystemPath} destPath Destination path, including destination filename
 * @param {boolean} [preserveSrc] Pass `true` if source item should not be deleted
 */
export const moveItem = (
  fileSystem: FileSystem,
  srcPath: FileSystemPath,
  destPath: FileSystemPath,
  preserveSrc?: boolean
): boolean => {
  // Validate source and destination paths
  if (srcPath.length === 0) return false;
  if (destPath.length === 0) return false;

  // Check if the item exists
  const item = getItemAt(fileSystem, srcPath);
  if (!item) return false;

  // Check if destination path is valid
  const destDirPath = destPath.slice(0, -1);
  const destDir = getItemAt(fileSystem, destDirPath);
  if (!destDir || isLeafNode(destDir)) return false;

  // Make a copy of the item and move it
  const destItemName = destPath[destPath.length - 1];
  const itemCopy = isLeafNode(item) ? { ...item } : new Map(Array.from(item));
  destDir.set(destItemName, itemCopy);

  // Remove the source item
  const srcDirPath = srcPath.slice(0, -1);
  const srcDir = getItemAt(fileSystem, srcDirPath);
  if (!srcDir || isLeafNode(srcDir))
    throw new Error('Something illegal just happened.');
  if (!preserveSrc) srcDir.delete(srcPath[srcPath.length - 1]);
  return true;
};
