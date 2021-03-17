import { v4 as uuid } from 'uuid';
import Tree, { TreeInternalNode, TreeNode, TreePath } from '../utils/tree';
import { InvalidArgError } from '../utils/errors';

export type FileBlob = {
  contentToken: string;
  version: number;
};

export type FileName = string;
export type FileSystem = Tree<FileBlob, FileName>;
export type FileSystemNode = TreeNode<FileBlob, FileName>;
export type FileSystemInternalNode = TreeInternalNode<FileBlob, FileName>;
export type FileSystemPath = TreePath<FileName>;

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
  return new Tree();
};

/**
 * Returns file/directory at given path in file system.
 * Invalid path returns null. Empty path returns root directory.
 */
export const getItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystemNode | null => {
  return fileSystem.get(path);
};

/**
 * Creates a new file at given path in file system.
 * Throws if specified path is invalid, or file already exists.
 *
 * Does NOT create any intermediate directories.
 */
export const createItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath,
  type: 'file' | 'directory'
): FileSystem => {
  const item = type === 'file' ? generateFileBlob() : undefined;
  return fileSystem.insert(path, item);
};

/**
 * Deletes file/directory at given path in file system.
 * Throws if path does not exist.
 */
export const deleteItemAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystem => {
  const item = fileSystem.get(path);
  if (!item) throw new InvalidArgError();
  return fileSystem.remove(path);
};

/**
 * Bump file version at given path in file system.
 * Throws if path is invalid or leads to internal node
 */
export const bumpFileVersionAt = (
  fileSystem: FileSystem,
  path: FileSystemPath
): FileSystem => {
  if (path.length === 0) throw new InvalidArgError();
  const file = getItemAt(fileSystem, path);
  if (!Tree.isLeafNode(file)) throw new InvalidArgError();
  const newFile = { ...file, version: file.version + 1 };
  return fileSystem.update(path, newFile);
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
): FileSystem => {
  // Validate source path
  if (srcPath.length === 0) throw new InvalidArgError('Bad source');
  const item = getItemAt(fileSystem, srcPath);
  if (!item) throw new InvalidArgError('Bad source');

  // Validate destination path
  if (destPath.length === 0) throw new InvalidArgError('Bad destination');
  const destDirPath = destPath.slice(0, -1);
  const destDir = getItemAt(fileSystem, destDirPath);
  if (!Tree.isInternalNode(destDir))
    throw new InvalidArgError('Bad destination');

  // Make a copy of the item and move it
  // 1. Remove the node already existing at destination
  let fsWithoutDest = fileSystem;
  if (fileSystem.get(destPath)) fsWithoutDest = fileSystem.remove(destPath);
  // 2. Add the source item to the destination
  const destItem = Tree.isLeafNode(item) ? { ...item } : item;
  const newFS = fsWithoutDest.insert(destPath, destItem);

  // Remove the source item if required
  return preserveSrc ? newFS : newFS.remove(srcPath);
};
