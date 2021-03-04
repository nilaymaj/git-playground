import { FileSystemNode, FileSystemPath } from '../../file-system/types';
import { isLeafNode, serializeLeafs } from '../../utils/tree';
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
import { isPrefix } from '../../utils/path-utils';

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
 * Creates a blank index file.
 */
export const createEmptyIndex = (): IndexFile =>
  SortedArray.create(comparePaths, []);

/**
 * Create an index tree from given file system tree.
 * May add objects to object storage for creating index entries.
 */
export const createIndexFromFileTree = (
  fileTree: FileSystemNode,
  objectStorage: GitObjectStorage,
  basePath: FileSystemPath = []
): IndexFile => {
  // Serialize file tree into its leaves
  const fileTreeLeaves = isLeafNode(fileTree)
    ? [{ path: basePath, value: fileTree }]
    : serializeLeafs(fileTree, compareNames, basePath);

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

/**
 * Gets the start and end index of the section of index file
 * that contains entries at or under the specified path.
 */
export const getPathSection = (
  indexFile: IndexFile,
  path: FileSystemPath
): { start: number; end: number } => {
  return SortedArray.findRange(indexFile, (entryPath) => {
    const isSubpath = isPrefix(entryPath, path);
    if (isSubpath) return 0;
    return comparePaths(entryPath, path);
  });
};

/**
 * Overwrites a part of the index file with the sub-index file provided.
 * The part overwritten is that which represents the index for given path.
 *
 * Fails if sub-index does not "fit" into the main index, ie a blind overwrite
 * would lead to an invalid index file.
 *
 * Ensure that the provided sub-index is self-consistent. If not,
 * the full index file will also become inconsistent.
 *
 * @param indexFile The index file, a part of which is to be overwritten.
 * @param path Determines the section of index file to be overwritten.
 * @param subIndex The replacement for overwritten section.
 */
export const overwriteSection = (
  indexFile: IndexFile,
  path: FileSystemPath,
  subIndex: IndexFile
) => {
  // Find the section of index file to be overwritten
  const sectionLimits = getPathSection(indexFile, path);

  // Validate that provided sub-index file fits in
  if (subIndex.items.length !== 0) {
    if (sectionLimits.start > 0) {
      // Check the starting boundary
      const itemBeforeSplit = indexFile.items[sectionLimits.start - 1].key;
      const firstSubItem = subIndex.items[0].key;
      if (comparePaths(itemBeforeSplit, firstSubItem) !== -1) return false;
    }
    if (sectionLimits.end < indexFile.items.length) {
      // Check the ending boundary
      const itemAfterSplit = indexFile.items[sectionLimits.end].key;
      const lastSubItem = subIndex.items[subIndex.items.length - 1].key;
      if (comparePaths(itemAfterSplit, lastSubItem) !== 1) return false;
    }
  }

  // Insert the provided sub-index array
  const preSection = indexFile.items.slice(0, sectionLimits.start);
  const postSection = indexFile.items.slice(sectionLimits.end);
  indexFile.items = [...preSection, ...subIndex.items, ...postSection];
  return true;
};
