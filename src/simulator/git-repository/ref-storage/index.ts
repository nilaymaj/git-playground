import { GitObjectAddress } from '../object-storage/types';
import {
  deleteNodeAt,
  getNodeAt,
  insertLeafAt,
  isLeafNode,
} from '../../utils/tree';
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
  branchHeads: new Map(),
});

/**
 * Read leaf ref located at given path in storage.
 * Returns `null` if path is invalid or does not lead to leaf ref.
 */
export const readRefAt = (
  storage: GitRefStorage,
  path: RefPath
): GitObjectAddress | null => {
  const refNode = getNodeAt(storage.branchHeads, path);
  if (!refNode || !isLeafNode(refNode)) return null;
  return refNode;
};

/**
 * Creates a new ref with given path in storage.
 * Returns `true` on success, fails if path leads to existing ref.
 */
export const createRefAt = (
  storage: GitRefStorage,
  path: RefPath,
  commitHash: GitObjectAddress
): boolean => {
  if (path.length === 0) return false;
  return insertLeafAt(storage.branchHeads, path, commitHash);
};

/**
 * Deletes leaf ref located at specified path in storage.
 * Returns `true` on success, fails if path is invalid or leads to subtree.
 */
export const deleteRefAt = (storage: GitRefStorage, path: RefPath): boolean => {
  const refNode = getNodeAt(storage.branchHeads, path);
  if (!refNode || !isLeafNode(refNode)) return false;
  return deleteNodeAt(storage.branchHeads, path);
};

/**
 * Returns the contents of local ref node at
 * given path in ref storage
 */
export const getRefContentsAt = (
  storage: GitRefStorage,
  path: RefPath
): [string, RefTreeNode][] | null => {
  const node = getNodeAt(storage.branchHeads, path);
  if (!node || isLeafNode(node)) return null;
  return Array.from(node);
};

/**
 * Updates the commit that ref at given path points to.
 * Returns true on success, fails if path is invalid.
 */
export const updateRefAt = (
  storage: GitRefStorage,
  path: RefPath,
  commitHash: GitObjectAddress
): boolean => {
  // Empty path can't point to leaf ref
  if (path.length === 0) return false;
  // Travel to parent of required ref
  const pathUptoLast = path.slice(0, -1);
  const leafRefName = path[path.length - 1];
  const refParent = getNodeAt(storage.branchHeads, pathUptoLast);
  if (!refParent || typeof refParent === 'string') return false;
  // Validate and update required leaf ref
  const subNode = refParent.get(leafRefName);
  if (!subNode || !isLeafNode(subNode)) return false;
  refParent.set(leafRefName, commitHash);
  return true;
};
