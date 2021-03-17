import { GitObjectAddress, GitBlob } from './types';
import Tree from '../../utils/tree';
import ObjectStorage from './index';
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
  storage: ObjectStorage
): SerializedGitTree | null => {
  const tree = storage.read(treeHash);
  if (!tree || tree.type !== 'tree') return null;
  // Iterate through children and add to serialized tree
  return Array.from(tree.items).reduce((mainNode, child) => {
    const [childName, hash] = child;
    const subNode = storage.read(hash);
    if (!subNode || subNode.type === 'commit')
      throw new Error('Commit object pointed to by tree object');
    // Blobs are leaf of serialized tree, so set directly
    if (subNode.type === 'blob') return mainNode.insert([childName], subNode);
    // Recursively serialize subtrees, and attach to target tree
    const serializedSubTree = serializeGitTree(hash, storage);
    if (!serializedSubTree) throw new Error(`This shouldn't happen.`);
    return mainNode.insert([childName], serializedSubTree._tree);
  }, new Tree() as SerializedGitTree);
};
