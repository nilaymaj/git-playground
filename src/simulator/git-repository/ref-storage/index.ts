import { GitObjectAddress } from '../object-storage/types';
import Tree, { TreeNode, TreePath } from '../../utils/tree';
import { InvalidArgError } from '../../utils/errors';

export type RefName = string;
export type RefPath = TreePath<RefName>;
export type RefTreeLeaf = GitObjectAddress;
export type RefTree = Tree<RefTreeLeaf, RefName>;
export type RefTreeNode = TreeNode<RefTreeLeaf, RefName>;

/**
 * Represents the ref storage of a Git repository.
 * Maintains local refs (branches) and remote refs in tree format.
 */
export interface GitRefStorage {
  branchHeads: RefTree;
}

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
  branchHeads: new Tree(),
});

/**
 * Read leaf ref located at given path in storage.
 * Returns `null` if path is invalid or does not lead to leaf ref.
 */
export const readRefAt = (
  storage: GitRefStorage,
  path: RefPath
): GitObjectAddress | null => {
  const refNode = storage.branchHeads.get(path);
  if (!Tree.isLeafNode(refNode)) return null;
  return refNode;
};

/**
 * Creates a new ref with given path in storage.
 *
 * Throws if path terminates prematurely or ref already exists.
 */
export const createRefAt = (
  storage: GitRefStorage,
  path: RefPath,
  commitHash: GitObjectAddress
): GitRefStorage => {
  // Check if path is valid
  if (path.length === 0) throw new InvalidArgError();
  const existingRef = storage.branchHeads.get(path);
  if (existingRef) throw new InvalidArgError();
  // Insert ref and return new ref storage
  const newRefTree = storage.branchHeads.insert(path, commitHash);
  return { ...storage, branchHeads: newRefTree };
};

/**
 * Deletes leaf ref located at specified path in storage.
 *
 * Throws if path is invalid.
 */
export const deleteLeafRef = (
  storage: GitRefStorage,
  path: RefPath
): GitRefStorage => {
  const refNode = storage.branchHeads.get(path);
  if (!Tree.isLeafNode(refNode)) throw new InvalidArgError();
  const newRefTree = storage.branchHeads.remove(path);
  return { ...storage, branchHeads: newRefTree };
};

/**
 * Returns the contents of local ref node at
 * given path in ref storage
 */
export const getRefContentsAt = (
  storage: GitRefStorage,
  path: RefPath
): [string, RefTreeNode][] => {
  const node = storage.branchHeads.get(path);
  if (!Tree.isInternalNode(node)) throw new InvalidArgError();
  return [...node.entries()];
};

/**
 * Updates the commit that ref at given path points to.
 *
 * Throws if path is invalid or does not lead to leaf ref.
 */
export const updateRefAt = (
  storage: GitRefStorage,
  path: RefPath,
  commitHash: GitObjectAddress
): GitRefStorage => {
  // Empty path can't point to leaf ref
  if (path.length === 0) throw new InvalidArgError();
  // Travel to parent of required ref
  const pathUptoLast = path.slice(0, -1);
  const leafRefName = path[path.length - 1];
  const refParent = storage.branchHeads.get(pathUptoLast);
  if (!Tree.isInternalNode(refParent)) throw new InvalidArgError();
  // Validate and update required leaf ref
  const subNode = refParent.get(leafRefName);
  if (!Tree.isLeafNode(subNode)) throw new InvalidArgError();
  const newRefTree = storage.branchHeads.update(path, commitHash);
  return { ...storage, branchHeads: newRefTree };
};
