import FileSystem, { FileSystemNode, FileSystemPath } from '../../file-system';
import Tree from '../../utils/tree';
import ObjectStorage from '../object-storage';
import { hashBlobObject } from '../object-storage/hash-object';
import { GitBlob, GitObjectAddress, GitTree } from '../object-storage/types';
import { serializeGitTree } from '../object-storage/utils';
import SortedArray, { SortedArrayItem } from '../../utils/sorted-array';
import { isPrefix } from '../../utils/path-utils';
import { Apocalypse, InvalidArgError } from '../../utils/errors';
import { List } from 'immutable';
import { createIndexTree, IndexTree } from './create-index-tree';

export interface IndexFileItem {
  objectHash: GitObjectAddress;
}

export type IndexArray = SortedArray<FileSystemPath, IndexFileItem>;
export type IndexArrayItem = SortedArrayItem<FileSystemPath, IndexFileItem>;

/**
 * Compare two strings lexicographically.
 * Return -1, 0 or 1 accordingly.
 */
const compareNames = (a: string, b: string): number => a.localeCompare(b);

/**
 * Compare two filepaths segment-wise lexicographically.
 * Returns -1, 0, 1 accordingly.
 */
export const comparePaths = (a: FileSystemPath, b: FileSystemPath): number => {
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
export default class IndexFile {
  _index: IndexArray;

  /**
   * Create a new IndexFile, optionally initialized with provided entries.
   * If `index` is provided as `List<IndexArrayItem>`, ensure that the list is pre-sorted.
   */
  constructor(index?: IndexArray | List<IndexArrayItem>) {
    if (!index) this._index = new SortedArray(comparePaths);
    else if (index instanceof SortedArray) this._index = index;
    else this._index = new SortedArray(comparePaths, index, true);
  }

  /**
   * Immutability helper method: use this to return IndexFile
   * instance with updated index entries.
   */
  private updatedClass = (newIndex: IndexArray) => {
    if (this._index === newIndex) return this;
    else return new IndexFile(newIndex);
  };

  /**
   * Returns the number of entries in index.
   */
  size = (): number => {
    return this._index.size();
  };

  /**
   * Returns the index entries, sorted by path.
   */
  entries = (): { path: FileSystemPath; entry: IndexFileItem }[] => {
    const rawEntries = [...this._index._items.entries()];
    return rawEntries.map((a) => ({ path: a[1].key, entry: a[1].value }));
  };

  /**
   * Create an index tree from given file system tree.
   * May add objects to object storage for creating index entries.
   */
  static fromFileTree = (
    fileTree: FileSystemNode,
    objectStorage: ObjectStorage,
    basePath: FileSystemPath = []
  ): { storage: ObjectStorage; indexFile: IndexFile } => {
    // Serialize file tree into its leaves
    const fileTreeLeaves = FileSystem.isFile(fileTree)
      ? [{ path: basePath, value: fileTree }]
      : new Tree(fileTree).toLeafArray(compareNames, basePath);

    // Convert file tree leaves to index file entries
    let newStorage = objectStorage;
    const indexEntries = fileTreeLeaves.map((leaf) => {
      const gitBlob: GitBlob = { type: 'blob', fileData: leaf.value };
      const { storage: objS, hash } = newStorage.write(gitBlob);
      newStorage = objS;
      return { key: leaf.path, value: { objectHash: hash } };
    });

    // Pack the entries into a SortedArray
    const index = new SortedArray(comparePaths, indexEntries);
    return { storage: newStorage, indexFile: new IndexFile(index) };
  };

  /**
   * Creates an index tree from a Git tree.
   * Returns `null` if given hash does not point to a tree.
   *
   * @todo Write tests for this
   */
  static fromGitTree = (
    objectStorage: ObjectStorage,
    tree: GitTree
  ): IndexFile => {
    // Serialize Git tree into an array of Git blobs
    const serializedTree = serializeGitTree(tree, objectStorage);
    const gitBlobLeaves = serializedTree.toLeafArray(compareNames);

    // Convert Git blob leaves to index file entries
    const indexEntries = gitBlobLeaves.map((leaf) => {
      const gitBlob = leaf.value;
      const objectHash = hashBlobObject(gitBlob);
      return { key: leaf.path, value: { objectHash } };
    });

    // Pack the entries into a SortedArray
    const newIndex = new SortedArray(comparePaths, indexEntries);
    return new IndexFile(newIndex);
  };

  /**
   * Get index entry at specified path.
   * Returns `null` if no entry exists at path.
   */
  get = (path: FileSystemPath): IndexFileItem | null => {
    if (path.length === 0) throw new InvalidArgError();
    const item = this._index.get(path).item;
    return item && item.value;
  };

  /**
   * Updates the index entry at provided path.
   * Insert entry if it does not exist.
   *
   * Always succeeds, unless empty path is provided.
   */
  upsert = (path: FileSystemPath, value: IndexFileItem): IndexFile => {
    if (path.length === 0) throw new InvalidArgError();
    const newIndex = this._index.update(path, value, true);
    return this.updatedClass(newIndex);
  };

  /**
   * Removes index entry at provided path.
   *
   * Throws if no entry exists at path.
   */
  remove = (path: FileSystemPath): IndexFile => {
    if (path.length === 0) throw new InvalidArgError();
    if (!this._index.get(path).item) throw new InvalidArgError();
    const newIndex = this._index.remove(path);
    return this.updatedClass(newIndex);
  };

  /**
   * Alias for `createIndexTree`. Converts the index file
   * to a tree format.
   */
  toTree = (): IndexTree => {
    return createIndexTree(this);
  };

  /**
   * Gets the start and end index of the section of index file
   * that contains entries at or under the specified path.
   */
  getPathSection = (path: FileSystemPath): { start: number; end: number } => {
    return this._index.findRange((entryPath) => {
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
  overwriteSection = (
    path: FileSystemPath,
    subIndex: IndexFile | IndexArray
  ): IndexFile => {
    // Get the underlying array of sub-index provided
    if (subIndex instanceof IndexFile) subIndex = subIndex._index;

    // Find the section of index file to be overwritten
    const sectionLimits = this.getPathSection(path);

    // Validate that provided sub-index file fits in
    if (subIndex.size() !== 0) {
      if (sectionLimits.start > 0) {
        // Check the starting boundary
        const itemBeforeSplit = this._index.itemAt(sectionLimits.start - 1);
        const firstSubItem = subIndex.itemAt(0);
        if (!itemBeforeSplit || !firstSubItem) throw new Apocalypse();
        if (comparePaths(itemBeforeSplit.key, firstSubItem.key) !== -1)
          throw new InvalidArgError();
      }
      if (sectionLimits.end < this._index.size()) {
        // Check the ending boundary
        const itemAfterSplit = this._index.itemAt(sectionLimits.end);
        const lastSubItem = subIndex.itemAt(subIndex.size() - 1);
        if (!itemAfterSplit || !lastSubItem) throw new Apocalypse();
        if (comparePaths(itemAfterSplit.key, lastSubItem.key) !== 1)
          throw new InvalidArgError();
      }
    }

    // Insert the provided sub-index array
    const preSection = this._index._items.slice(0, sectionLimits.start);
    const postSection = this._index._items.slice(sectionLimits.end);
    const newIndexRawItems = [
      ...preSection,
      ...subIndex._items,
      ...postSection,
    ];
    const newIndex = new SortedArray(comparePaths, newIndexRawItems, true);
    return this.updatedClass(newIndex);
  };
}
