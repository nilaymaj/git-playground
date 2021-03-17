import { v4 as uuid } from 'uuid';
import Tree, { TreeInternalNode, TreeNode, TreePath } from '../utils/tree';
import { InvalidArgError } from '../utils/errors';

export type FileBlob = {
  contentToken: string;
  version: number;
};

export type FileName = string;
export type FileSystemTree = Tree<FileBlob, FileName>;
export type FileSystemNode = TreeNode<FileBlob, FileName>;
export type FileSystemInternalNode = TreeInternalNode<FileBlob, FileName>;
export type FileSystemPath = TreePath<FileName>;

/**
 * A simple in-memory file system with support CRUD-like
 * operations and copy-move functionality.
 */
export default class FileSystem {
  _fs: FileSystemTree;

  /**
   * Create a new FileSystem, optionally with the provided
   * file system tree or tree node.
   */
  constructor(fs?: FileSystemTree | FileSystemInternalNode) {
    if (!fs) this._fs = new Tree();
    else {
      if (fs instanceof Tree) this._fs = fs;
      else this._fs = new Tree(fs);
    }
  }

  /**
   * Immutability helper class: Use this to return a new
   * FileSystem instance with updated file tree.
   */
  private updatedClass = (newFS: FileSystemTree): FileSystem => {
    if (newFS === this._fs) return this;
    else return new FileSystem(newFS);
  };

  /**
   * Check whether the provided node is a file blob.
   */
  static isFile = (node?: FileSystemNode | null): node is FileBlob => {
    if (!node) return false;
    return Tree.isLeafNode(node);
  };

  /**
   * Check whether the provided node is a directory node.
   */
  static isDirectory = (
    node?: FileSystemNode | null
  ): node is FileSystemInternalNode => {
    if (!node) return false;
    return Tree.isInternalNode(node);
  };

  /**
   * Create a new file blob seeded randomly.
   *
   * @param token Use this to override the random seed.
   * USE ONLY FOR TESTING.
   */
  static generateFileBlob = (token?: string): FileBlob => ({
    contentToken: token || uuid(),
    version: 0,
  });

  /**
   * Get the node located at specified path in the file system.
   */
  get = (path: FileSystemPath): FileSystemNode | null => {
    if (path.length === 0) return this._fs._tree;
    return this._fs.get(path);
  };

  /**
   * Create a new file or empty directory at the specified path.
   *
   * Throws if path terminates prematurely or already exists.
   */
  create = (path: FileSystemPath, type: 'file' | 'directory'): FileSystem => {
    if (this.get(path)) throw new InvalidArgError('Already exists');
    const item = type === 'file' ? FileSystem.generateFileBlob() : undefined;
    const newFS = this._fs.insert(path, item);
    return this.updatedClass(newFS);
  };

  /**
   * Delete node located at specified path in file system.
   *
   * Throws if path does not exist.
   */
  delete = (path: FileSystemPath): FileSystem => {
    const item = this.get(path);
    if (!item) throw new InvalidArgError();
    const newFS = this._fs.remove(path);
    return this.updatedClass(newFS);
  };

  /**
   * Bump the version of file located at specified path by 1.
   *
   * Throws if path does not lead to file.
   */
  bumpFileVersion = (path: FileSystemPath): FileSystem => {
    if (path.length === 0) throw new InvalidArgError();
    const file = this.get(path);
    if (!FileSystem.isFile(file)) throw new InvalidArgError();
    const newFile = { ...file, version: file.version + 1 };
    const newFS = this._fs.update(path, newFile);
    return this.updatedClass(newFS);
  };

  /**
   * Move a node from one location in file system to another.
   * Use with care: overwrites anything located at the destination path.
   *
   * Removes the node at source path by default. Pass `preserveSrc: true` to
   * *copy* the node to destination instead.
   */
  move = (
    srcPath: FileSystemPath,
    destPath: FileSystemPath,
    preserveSrc?: boolean
  ): FileSystem => {
    // Validate source path
    if (srcPath.length === 0) throw new InvalidArgError('Bad source');
    const item = this.get(srcPath);
    if (!item) throw new InvalidArgError('Bad source');

    // Validate destination path
    if (destPath.length === 0) throw new InvalidArgError('Bad destination');
    const destDirPath = destPath.slice(0, -1);
    const destDir = this.get(destDirPath);
    if (!FileSystem.isDirectory(destDir))
      throw new InvalidArgError('Bad destination');

    // Make a copy of the item and move it
    // 1. Remove the node already existing at destination
    const destExists = !!this._fs.get(destPath);
    const fsWithoutDest = destExists ? this._fs.remove(destPath) : this._fs;
    // 2. Add the source item to the destination
    const destItem = FileSystem.isFile(item) ? { ...item } : item;
    const fsWithDest = fsWithoutDest.insert(destPath, destItem);

    // Remove the source item if required
    const newFS = preserveSrc ? fsWithDest : fsWithDest.remove(srcPath);
    return this.updatedClass(newFS);
  };
}
