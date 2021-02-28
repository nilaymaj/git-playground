import { GitObjectAddress, GitObjectStorage, GitBlob } from './types';
import { Tree } from '../../utils/tree';
import { readObject } from './index';

export type SerializedGitTree = Tree<GitBlob, string>;

/**
 * Walks through and serializes a Git work tree into
 * a direct tree format. Returns `null` if given hash
 * does not correspond to a tree object.
 *
 * @todo Write tests for this
 */
export const serializeGitTree = (
  treeHash: GitObjectAddress,
  storage: GitObjectStorage
): SerializedGitTree | null => {
  const tree = readObject(storage, treeHash);
  if (!tree || tree.type !== 'tree') return null;
  // Iterate through children and add to serialized tree
  return Array.from(tree.items).reduce((mainNode, child) => {
    const [childName, hash] = child;
    const subNode = readObject(storage, hash);
    if (!subNode || subNode.type === 'commit')
      throw new Error('Commit object pointed to by tree object');
    // Blobs are leaf of serialized tree, so set directly
    if (subNode.type === 'blob') return mainNode.set(childName, subNode);
    // Recursively serialize subtrees, and attach to target tree
    const serializedSubTree = serializeGitTree(hash, storage);
    return mainNode.set(childName, serializedSubTree);
  }, new Map());
};
