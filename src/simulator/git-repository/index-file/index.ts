import { FileSystem, FileSystemPath } from '../../file-system/types';
import { serializeLeafs } from '../../utils/tree';
import { writeObject } from '../object-storage';
import { hashBlobObject } from '../object-storage/hash-object';
import {
  GitBlob,
  GitObjectAddress,
  GitObjectStorage,
} from '../object-storage/types';
import { serializeGitTree } from '../object-storage/utils';
import * as SortedArray from '../../utils/sorted-array';
import { IndexFile, IndexFileItem } from './types';

/**
 * Compare two strings lexicographically.
 * Return -1, 0 or 1 accordingly.
 */
const compareNames = (a: string, b: string): number => a.localeCompare(b);

/**
 * Compare two filepaths segment-wise lexicographically.
 * Returns -1, 0, 1 accordingly.
 */
const comparePaths = (a: FileSystemPath, b: FileSystemPath): number => {
  if (a.length === 0 && b.length === 0) return 0;
  else if (a.length === 0) return -1;
  else if (b.length === 0) return 1;
  else {
    const nameCmp = compareNames(a[0], b[0]);
    if (nameCmp !== 0) return nameCmp;
    return comparePaths(a.slice(1), b.slice(1));
  }
};

/**
 * The index file acts as a cache between the file system tree and
 * the Git working tree. The structure is identical to a tree, with
 * leaves representing the files in the index.
 *
 * The index file plays the following roles:
 * - Compare index with FS or working tree to get unstaged/staged changes
 * - Working tree in index file is used as work tree for next commit
 */

/**
 * Create an index tree from given file system tree.
 * May add objects to object storage for creating index entries.
 */
export const createIndexFromFileTree = (
  fileTree: FileSystem,
  objectStorage: GitObjectStorage,
  basePath: FileSystemPath = []
): IndexFile => {
  // Serialize file tree into its leaves
  const fileTreeLeaves = serializeLeafs(fileTree, compareNames, basePath);

  // Convert file tree leaves to index file entries
  const indexEntries = fileTreeLeaves.map((leaf) => {
    const gitBlob: GitBlob = { type: 'blob', fileData: leaf.value };
    const objectHash = writeObject(objectStorage, gitBlob);
    const indexValue = { lastModified: leaf.value.lastModified, objectHash };
    return { key: leaf.path, value: indexValue };
  });

  // Pack the entries into a SortedArray
  return SortedArray.create(comparePaths, indexEntries);
};

/**
 * Creates an index tree from a Git tree.
 * Returns `null` if given hash does not point to a tree.
 *
 * @todo Write tests for this
 */
export const createIndexFromGitTree = (
  treeHash: GitObjectAddress,
  objectStorage: GitObjectStorage
): IndexFile | null => {
  // Serialize Git tree into a tree of Git blobs
  const serializedTree = serializeGitTree(treeHash, objectStorage);
  if (!serializedTree) return null;

  // Serialize blob tree into array of Git blobs
  const gitBlobLeaves = serializeLeafs(serializedTree, compareNames);

  // Convert Git blob leaves to index file entries
  const indexEntries = gitBlobLeaves.map((leaf) => {
    const gitBlob = leaf.value;
    const objectHash = hashBlobObject(gitBlob);
    const indexValue = {
      lastModified: gitBlob.fileData.lastModified,
      objectHash,
    };
    return { key: leaf.path, value: indexValue };
  });

  // Pack the entries into a SortedArray
  return SortedArray.create(comparePaths, indexEntries);
};

/**
 * Get index entry at specified path.
 * Returns `null` if no entry exists at path.
 */
export const getEntry = (
  indexFile: IndexFile,
  path: FileSystemPath
): IndexFileItem | null => {
  if (path.length === 0) return null;
  const item = SortedArray.getByKey(indexFile, path).item;
  return item && item.value;
};

/**
 * Updates the index entry at provided path.
 * Inserts entry if it does not exist.
 *
 * Returns `false` if given path is empty.
 */
export const upsert = (
  indexFile: IndexFile,
  path: FileSystemPath,
  value: IndexFileItem
): boolean => {
  if (path.length === 0) return false;
  const result = SortedArray.update(indexFile, path, value, true);
  if (!result) throw new Error(`Index upsert failed - this shouldn't happen!`);
  return true;
};

/**
 * Removes index entry at provided path.
 *
 * Returns `false` if entry does not exist.
 */
export const remove = (indexFile: IndexFile, path: FileSystemPath): boolean => {
  if (path.length === 0) return false;
  return SortedArray.deleteItem(indexFile, path);
};
