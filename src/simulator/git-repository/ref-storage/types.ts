import { GitObjectAddress } from '../object-storage/types';
import { Tree, TreeNode, TreePath } from '../../utils/tree';

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
