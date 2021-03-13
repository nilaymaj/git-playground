import { FileSystemPath } from '../../file-system/types';
import { create, Tree } from '../../utils/tree';
import { IndexFile, IndexFileItem } from './types';

export type IndexTree = Tree<IndexFileItem, string>;

/**
 * From a sorted-array format index file, creates an index tree
 * with leaves representing each index entry.
 *
 * Throws if the index file does not represent a valid tree, ie
 * there are index entries both for a path and its subpath.
 *
 * Algorithm:
 * 1. Split index file into chunks representing each file/directory under root.
 * 2. For each chunk:
 *     1. If chunk represents direct file entry, add leaf to index tree.
 *     2. Else, recursively create index tree for chunk and attach to root tree.
 */
export const createIndexTree = (index: IndexFile): IndexTree => {
  const filePaths = index.items.toArray().map((entry) => entry.key);
  const chunks = getRootNameChunks(filePaths);

  return chunks.reduce((rootNode, chunk) => {
    // Check if chunk corresponds to file entry
    if (chunk.end - chunk.start === 1) {
      // Chunk may correspond to file entry...
      const indexEntry = index.items.get(chunk.start);
      if (!indexEntry) throw new Error(`This shouldn't happen.`);
      if (indexEntry.key.length === 1) {
        // Chunk corresponds to file entry: add leaf to index tree
        return rootNode.set(chunk.name, indexEntry.value);
      }
    }

    // Create sub-index corresponding to chunk
    const subIndexItems = index.items
      .slice(chunk.start, chunk.end)
      .map((item) => ({ ...item, key: item.key.slice(1) }));
    const subIndex = { ...index, items: subIndexItems };
    // Recursively create index tree for sub-index
    const subIndexTree = createIndexTree(subIndex);
    // Attach sub-index tree to root node
    return rootNode.set(chunk.name, subIndexTree);
  }, create() as Tree<IndexFileItem, string>);
};

/**
 * Given a **sorted** list of file paths, returns a list of "name chunks".
 * Each name chunk corresponds to a subarray of the file path list, with
 * - name: the common first path segment of the paths in subarray
 * - start: start position of subarray in original array
 * - end: one index after the end position of subarray
 *
 * Throws, if a given path is empty.
 */
const getRootNameChunks = (fullPaths: FileSystemPath[]): NameChunk[] => {
  if (fullPaths.length === 0) return [];

  // Each chunk stores item name and indices where its segment starts
  // and ends in the provided list of paths
  const chunks: NameChunk[] = [];
  let index: number = -1; // Index of file path being considered
  let currentStart: number = -1; // Start index of current chunk
  let currentName: string = ''; // Item name in current chunk

  // Loop through paths and push to chunks
  while (index < fullPaths.length - 1) {
    // Empty paths are not allowed
    const path = fullPaths[++index];
    if (path.length === 0) throw new Error('Empty path found');
    const itemName = path[0];
    if (itemName === currentName) continue;

    // If chunk has changed...
    if (index !== 0) {
      // Push previous chunk to list. There's no previous chunk for index = 0.
      chunks.push({ name: currentName, start: currentStart, end: index });
    }
    // Prepare for next chunk
    currentStart = index;
    currentName = itemName;
  }

  // Push the last chunk
  chunks.push({ name: currentName, start: currentStart, end: index + 1 });
  return chunks;
};

type NameChunk = {
  name: string;
  start: number;
  end: number;
};
