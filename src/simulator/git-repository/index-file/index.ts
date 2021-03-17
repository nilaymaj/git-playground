import { FileSystemNode, FileSystemPath } from '../../file-system';
import Tree from '../../utils/tree';
import ObjectStorage from '../object-storage';
import { hashBlobObject } from '../object-storage/hash-object';
import { GitBlob, GitObjectAddress } from '../object-storage/types';
import { serializeGitTree } from '../object-storage/utils';
import SortedArray from '../../utils/sorted-array';
import { IndexFile, IndexFileItem } from './types';
import { isPrefix } from '../../utils/path-utils';
import { Apocalypse } from '../../utils/errors';

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
export const createEmptyIndex = (): IndexFile => new SortedArray(comparePaths);

/**
 * Create an index tree from given file system tree.
 * May add objects to object storage for creating index entries.
 */
export const createIndexFromFileTree = (
  fileTree: FileSystemNode,
  objectStorage: ObjectStorage,
  basePath: FileSystemPath = []
): { storage: ObjectStorage; indexFile: IndexFile } => {
  // Serialize file tree into its leaves
  const fileTreeLeaves = Tree.isLeafNode(fileTree)
    ? [{ path: basePath, value: fileTree }]
    : new Tree(fileTree).toLeafArray(compareNames, basePath);

  // Convert file tree leaves to index file entries
  let newObjectStorage = objectStorage;
  const indexEntries = fileTreeLeaves.map((leaf) => {
    const gitBlob: GitBlob = { type: 'blob', fileData: leaf.value };
    const { storage: objS, hash } = newObjectStorage.write(gitBlob);
    newObjectStorage = objS;
    return { key: leaf.path, value: { objectHash: hash } };
  });

  // Pack the entries into a SortedArray
  const newIndexFile = new SortedArray(comparePaths, indexEntries);
  return { storage: newObjectStorage, indexFile: newIndexFile };
};

/**
 * Creates an index tree from a Git tree.
 * Returns `null` if given hash does not point to a tree.
 *
 * @todo Write tests for this
 */
export const createIndexFromGitTree = (
  treeHash: GitObjectAddress,
  objectStorage: ObjectStorage
): IndexFile | null => {
  // Serialize Git tree into a tree of Git blobs
  const serializedTree = serializeGitTree(treeHash, objectStorage);
  if (!serializedTree) return null;

  // Serialize blob tree into array of Git blobs
  const gitBlobLeaves = serializedTree.toLeafArray(compareNames);

  // Convert Git blob leaves to index file entries
  const indexEntries = gitBlobLeaves.map((leaf) => {
    const gitBlob = leaf.value;
    const objectHash = hashBlobObject(gitBlob);
    return { key: leaf.path, value: { objectHash } };
  });

  // Pack the entries into a SortedArray
  return new SortedArray(comparePaths, indexEntries);
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
  const item = indexFile.get(path).item;
  return item && item.value;
};

/**
 * Updates the index entry at provided path.
 * Inserts entry if it does not exist.
 *
 * Returns `null` if given path is empty.
 */
export const upsert = (
  indexFile: IndexFile,
  path: FileSystemPath,
  value: IndexFileItem
): IndexFile | null => {
  if (path.length === 0) return null;
  return indexFile.update(path, value, true);
};

/**
 * Removes index entry at provided path.
 *
 * Returns `null` if entry does not exist.
 */
export const remove = (
  indexFile: IndexFile,
  path: FileSystemPath
): IndexFile | null => {
  if (path.length === 0) return null;
  if (!indexFile.get(path).item) return null;
  return indexFile.remove(path);
};

/**
 * Gets the start and end index of the section of index file
 * that contains entries at or under the specified path.
 */
export const getPathSection = (
  indexFile: IndexFile,
  path: FileSystemPath
): { start: number; end: number } => {
  return indexFile.findRange((entryPath) => {
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
 *
 * @todo Write tests for this!
 */
export const overwriteSection = (
  indexFile: IndexFile,
  path: FileSystemPath,
  subIndex: IndexFile
): IndexFile | null => {
  // Find the section of index file to be overwritten
  const sectionLimits = getPathSection(indexFile, path);

  // Validate that provided sub-index file fits in
  if (subIndex.size() !== 0) {
    if (sectionLimits.start > 0) {
      // Check the starting boundary
      const itemBeforeSplit = indexFile.itemAt(sectionLimits.start - 1);
      const firstSubItem = subIndex.itemAt(0);
      if (!itemBeforeSplit || !firstSubItem) throw new Apocalypse();
      if (comparePaths(itemBeforeSplit.key, firstSubItem.key) !== -1)
        return null;
    }
    if (sectionLimits.end < indexFile.size()) {
      // Check the ending boundary
      const itemAfterSplit = indexFile.itemAt(sectionLimits.end);
      const lastSubItem = subIndex.itemAt(subIndex.size() - 1);
      if (!itemAfterSplit || !lastSubItem) throw new Apocalypse();
      if (comparePaths(itemAfterSplit.key, lastSubItem.key) !== 1) return null;
    }
  }

  // Insert the provided sub-index array
  const preSection = indexFile._items.slice(0, sectionLimits.start);
  const postSection = indexFile._items.slice(sectionLimits.end);
  const newIndexRawItems = [...preSection, ...subIndex._items, ...postSection];
  return new SortedArray(comparePaths, newIndexRawItems, true);
};
