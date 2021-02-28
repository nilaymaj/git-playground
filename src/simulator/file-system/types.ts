import { Tree, TreeInternalNode, TreeNode, TreePath } from '../utils/tree';

interface FileContents {
  contentToken: string;
  version: number;
}

export interface FileBlob {
  contents: FileContents;
  lastModified: Date;
}

export type FileName = string;
export type FileSystem = Tree<FileBlob, FileName>;
export type FileSystemNode = TreeNode<FileBlob, FileName>;
export type FileSystemInternalNode = TreeInternalNode<FileBlob, FileName>;
export type FileSystemPath = TreePath<FileName>;
