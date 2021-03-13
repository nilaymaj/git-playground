import { Tree, TreeInternalNode, TreeNode, TreePath } from '../utils/tree';

export type FileBlob = {
  contentToken: string;
  version: number;
};

export type FileName = string;
export type FileSystem = Tree<FileBlob, FileName>;
export type FileSystemNode = TreeNode<FileBlob, FileName>;
export type FileSystemInternalNode = TreeInternalNode<FileBlob, FileName>;
export type FileSystemPath = TreePath<FileName>;
