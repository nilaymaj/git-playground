import { v4 as uuid } from 'uuid';
import * as Tree from '../utils/tree';
import { FileSystem, FileBlob, FileSystemPath, FileSystemNode } from './types';

/**
 * Generates new file blob with unique "contents"
 *
 * @param {string} [token] Sets unique content token to provided string. Use ONLY for testing purposes.
 */
export const generateFileBlob = (token?: string): FileBlob => ({
  contentToken: token || uuid(),
  version: 0,
});

/**
 * Creates a new blank file system
 */
export const createFileSystem = (): FileSystem => {
  return Tree.create();
};

/**
 * Returns file/directory at given path in file system.
 * Invalid path returns null. Empty path returns root directory.
 */
export const getItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystemNode | null => {
  return Tree.getNodeAt(fileSystem, path);
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
): FileSystem | null => {
  const item = type === 'file' ? generateFileBlob() : undefined;
  return Tree.insertNodeAt(fileSystem, path, item);
};

/**
 * Deletes file/directory at given path in file system.
 * Returns true on success, false if path invalid.
 */
export const deleteItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystem | null => {
  return Tree.deleteNodeAt(fileSystem, path);
};

/**
 * Bump file version at given path in file system.
 * Returns new FS on success, `null` if path invalid.
 */
export const bumpFileVersionAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystem | null => {
  if (path.length === 0) return null;
  const file = getItemAt(fileSystem, path);
  if (!file || !Tree.isLeafNode(file)) return null;
  const newFile = { ...file, version: file.version + 1 };
  return Tree.updateLeafAt(fileSystem, path, newFile);
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
): FileSystem | null => {
  // Validate source and destination paths
  if (srcPath.length === 0) return null;
  if (destPath.length === 0) return null;

  // Check if the item exists
  const item = getItemAt(fileSystem, srcPath);
  if (!item) return null;

  // Check if destination path is valid
  const destDirPath = destPath.slice(0, -1);
  const destDir = getItemAt(fileSystem, destDirPath);
  if (!destDir || Tree.isLeafNode(destDir)) return null;

  // Make a copy of the item and move it
  // 1. Remove the node already existing at destination
  let fsWithoutDest = Tree.deleteNodeAt(fileSystem, destPath);
  if (!fsWithoutDest) fsWithoutDest = fileSystem;
  // 2. Add the source item to the destination
  const destItem = Tree.isLeafNode(item) ? { ...item } : item;
  const newFS = Tree.insertNodeAt(fsWithoutDest, destPath, destItem);
  if (!newFS) throw new Error(`This shouldn't happen.`);

  // Remove the source item if required
  return preserveSrc ? newFS : Tree.deleteNodeAt(newFS, srcPath);
};
