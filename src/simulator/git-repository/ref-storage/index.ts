import { GitObjectAddress } from '../object-storage/types';
import Tree, { TreeInternalNode, TreeNode, TreePath } from '../../utils/tree';
import { InvalidArgError } from '../../utils/errors';

export type RefName = string;
export type RefPath = TreePath<RefName>;
export type RefTreeLeaf = GitObjectAddress;
export type RefTree = Tree<RefTreeLeaf, RefName>;
export type RefTreeNode = TreeNode<RefTreeLeaf, RefName>;
export type RefTreeInternalNode = TreeInternalNode<RefTreeLeaf, RefName>;

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
export default class RefStorage {
  _branchHeads: RefTree;

  /**
   * Create a new instance of RefStorage, optionally
   * initialized with provided ref tree.
   */
  constructor(branchHeads?: RefTree | RefTreeInternalNode) {
    if (!branchHeads) this._branchHeads = new Tree();
    else {
      if (branchHeads instanceof Tree) this._branchHeads = branchHeads;
      else this._branchHeads = new Tree(branchHeads);
    }
  }

  /**
   * Immutability helper method: use this to return RefStorage
   * instance with updated ref tree.
   */
  private updatedClass = (newBranchHeads: RefTree): RefStorage => {
    if (newBranchHeads === this._branchHeads) return this;
    else return new RefStorage(newBranchHeads);
  };

  /**
   * Checks if the provided node is a leaf ref.
   */
  static isLeaf = (node: RefTreeNode | null): node is RefTreeLeaf => {
    if (!node) return false;
    else return typeof node === 'string';
  };

  /**
   * Return the node located at given path in ref tree.
   */
  get = (path: RefPath): RefTreeNode | null => {
    if (path.length === 0) return this._branchHeads._tree;
    else return this._branchHeads.get(path);
  };

  /**
   * Read the commit hash that a leaf ref points to.
   */
  readLeaf = (path: RefPath): GitObjectAddress => {
    if (path.length === 0) throw new InvalidArgError();
    const refNode = this._branchHeads.get(path);
    if (!RefStorage.isLeaf(refNode)) throw new InvalidArgError();
    return refNode;
  };

  /**
   * Create a new leaf ref at the specified path.
   *
   * Throws if ref already exists at path or path terminates prematurely.
   */
  create = (path: RefPath, commitHash: GitObjectAddress): RefStorage => {
    // Check if path is valid
    if (path.length === 0) throw new InvalidArgError();
    const existingRef = this._branchHeads.get(path);
    if (existingRef) throw new InvalidArgError();
    // Insert leaf ref
    const newRefTree = this._branchHeads.insert(path, commitHash);
    return this.updatedClass(newRefTree);
  };

  /**
   * Deletes leaf ref located at the specified path.
   *
   * Throws if no ref is located at the specified path.
   */
  delete = (path: RefPath): RefStorage => {
    const refNode = this._branchHeads.get(path);
    if (!RefStorage.isLeaf(refNode)) throw new InvalidArgError();
    const newRefTree = this._branchHeads.remove(path);
    return this.updatedClass(newRefTree);
  };

  /**
   * Returns list of the direct children of internal ref
   * located at the specified path.
   *
   * Throws if path is invalid or leads to leaf ref.
   */
  getChildren = (path: RefPath): [string, RefTreeNode][] => {
    const node = this._branchHeads.get(path);
    if (!node || RefStorage.isLeaf(node)) throw new InvalidArgError();
    return [...node.entries()];
  };

  /**
   * Updates the leaf ref located at the specified path to
   * the new commit address provided.
   */
  update = (path: RefPath, commitHash: GitObjectAddress): RefStorage => {
    if (path.length === 0) throw new InvalidArgError();
    const refNode = this._branchHeads.get(path);
    if (!refNode || !RefStorage.isLeaf(refNode)) throw new InvalidArgError();
    const newRefTree = this._branchHeads.update(path, commitHash);
    return this.updatedClass(newRefTree);
  };
}

// /**
//  * Creates an empty ref storage object
//  */
// export const createRefStorage = (): GitRefStorage => ({
//   branchHeads: new Tree(),
// });

// /**
//  * Read leaf ref located at given path in storage.
//  * Returns `null` if path is invalid or does not lead to leaf ref.
//  */
// export const readRefAt = (
//   storage: GitRefStorage,
//   path: RefPath
// ): GitObjectAddress | null => {
//   const refNode = storage.branchHeads.get(path);
//   if (!Tree.isLeafNode(refNode)) return null;
//   return refNode;
// };

// /**
//  * Creates a new ref with given path in storage.
//  *
//  * Throws if path terminates prematurely or ref already exists.
//  */
// export const createRefAt = (
//   storage: GitRefStorage,
//   path: RefPath,
//   commitHash: GitObjectAddress
// ): GitRefStorage => {
//   // Check if path is valid
//   if (path.length === 0) throw new InvalidArgError();
//   const existingRef = storage.branchHeads.get(path);
//   if (existingRef) throw new InvalidArgError();
//   // Insert ref and return new ref storage
//   const newRefTree = storage.branchHeads.insert(path, commitHash);
//   return { ...storage, branchHeads: newRefTree };
// };

// /**
//  * Deletes leaf ref located at specified path in storage.
//  *
//  * Throws if path is invalid.
//  */
// export const deleteLeafRef = (
//   storage: GitRefStorage,
//   path: RefPath
// ): GitRefStorage => {
//   const refNode = storage.branchHeads.get(path);
//   if (!Tree.isLeafNode(refNode)) throw new InvalidArgError();
//   const newRefTree = storage.branchHeads.remove(path);
//   return { ...storage, branchHeads: newRefTree };
// };

// /**
//  * Returns the contents of local ref node at
//  * given path in ref storage
//  */
// export const getRefContentsAt = (
//   storage: GitRefStorage,
//   path: RefPath
// ): [string, RefTreeNode][] => {
//   const node = storage.branchHeads.get(path);
//   if (!Tree.isInternalNode(node)) throw new InvalidArgError();
//   return [...node.entries()];
// };

// /**
//  * Updates the commit that ref at given path points to.
//  *
//  * Throws if path is invalid or does not lead to leaf ref.
//  */
// export const updateRefAt = (
//   storage: GitRefStorage,
//   path: RefPath,
//   commitHash: GitObjectAddress
// ): GitRefStorage => {
//   // Empty path can't point to leaf ref
//   if (path.length === 0) throw new InvalidArgError();
//   // Travel to parent of required ref
//   const pathUptoLast = path.slice(0, -1);
//   const leafRefName = path[path.length - 1];
//   const refParent = storage.branchHeads.get(pathUptoLast);
//   if (!Tree.isInternalNode(refParent)) throw new InvalidArgError();
//   // Validate and update required leaf ref
//   const subNode = refParent.get(leafRefName);
//   if (!Tree.isLeafNode(subNode)) throw new InvalidArgError();
//   const newRefTree = storage.branchHeads.update(path, commitHash);
//   return { ...storage, branchHeads: newRefTree };
// };
