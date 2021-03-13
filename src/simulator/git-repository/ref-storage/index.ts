import { GitObjectAddress } from '../object-storage/types';
import * as Tree from '../../utils/tree';
import { GitRefStorage, RefPath, RefTreeNode } from './types';

/**
 * The ref storage is a tree structure for storing
 * Git refs - both local and remote, in separate namespaces.
 * This storage corresponds to the directory `.git/refs`.
 *
 * The actual refs, i.e leaf nodes of the tree, contain the SHA-1
 * hash address to corresponding commit objects in the object storage.
 */

/**
 * Creates an empty ref storage object
 */
export const createRefStorage = (): GitRefStorage => ({
  branchHeads: Tree.create(),
});

/**
 * Read leaf ref located at given path in storage.
 * Returns `null` if path is invalid or does not lead to leaf ref.
 */
export const readRefAt = (
  storage: GitRefStorage,
  path: RefPath
): GitObjectAddress | null => {
  const refNode = Tree.getNodeAt(storage.branchHeads, path);
  if (!refNode || !Tree.isLeafNode(refNode)) return null;
  return refNode;
};

/**
 * Creates a new ref with given path in storage.
 * Returns new ref storage on success, `null` if path leads to existing ref.
 */
export const createRefAt = (
  storage: GitRefStorage,
  path: RefPath,
  commitHash: GitObjectAddress
): GitRefStorage | null => {
  if (path.length === 0) return null;
  const newRefTree = Tree.insertNodeAt(storage.branchHeads, path, commitHash);
  return newRefTree && { ...storage, branchHeads: newRefTree };
};

/**
 * Deletes leaf ref located at specified path in storage.
 * Returns `true` on success, fails if path is invalid or leads to subtree.
 */
export const deleteRefAt = (
  storage: GitRefStorage,
  path: RefPath
): GitRefStorage | null => {
  const refNode = Tree.getNodeAt(storage.branchHeads, path);
  if (!refNode || !Tree.isLeafNode(refNode)) return null;
  const newRefTree = Tree.deleteNodeAt(storage.branchHeads, path);
  return newRefTree && { ...storage, branchHeads: newRefTree };
};

/**
 * Returns the contents of local ref node at
 * given path in ref storage
 */
export const getRefContentsAt = (
  storage: GitRefStorage,
  path: RefPath
): [string, RefTreeNode][] | null => {
  const node = Tree.getNodeAt(storage.branchHeads, path);
  if (!node || Tree.isLeafNode(node)) return null;
  return [...node.entries()];
};

/**
 * Updates the commit that ref at given path points to.
 * Returns true on success, fails if path is invalid.
 */
export const updateRefAt = (
  storage: GitRefStorage,
  path: RefPath,
  commitHash: GitObjectAddress
): GitRefStorage | null => {
  // Empty path can't point to leaf ref
  if (path.length === 0) return null;
  // Travel to parent of required ref
  const pathUptoLast = path.slice(0, -1);
  const leafRefName = path[path.length - 1];
  const refParent = Tree.getNodeAt(storage.branchHeads, pathUptoLast);
  if (!refParent || Tree.isLeafNode(refParent)) return null;
  // Validate and update required leaf ref
  const subNode = refParent.get(leafRefName);
  if (!subNode || !Tree.isLeafNode(subNode)) return null;
  const newRefTree = storage.branchHeads.updateIn(path, 0, () => commitHash);
  return { ...storage, branchHeads: newRefTree };
};
