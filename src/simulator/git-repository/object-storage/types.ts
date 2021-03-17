import { FileBlob } from '../../file-system';
import { Map as IMMap } from 'immutable';

/**
 * A simple Git blob, representing the contents of a single file
 */
export interface GitBlob {
  type: 'blob';
  fileData: FileBlob;
}

/**
 * Represents a directory tree object in Git,
 * with filename pointers to subtrees and blobs.
 */
export interface GitTree {
  type: 'tree';
  items: Map<string, GitObjectAddress>;
}

/**
 * A commit object containing metadata and work tree of a single commit
 */
export interface GitCommit {
  type: 'commit';
  message: string;
  timestamp: Date;
  parent: GitObjectAddress | null;
  workTree: GitObjectAddress;
}

/**
 * A generic Git object - can be a blob, tree or commit object.
 */
export type GitObject = GitBlob | GitTree | GitCommit;

/**
 * The SHA-1 address to a Git object.
 */
export type GitObjectAddress = string;

/**
 * The underlying data structure of Git Object Storage.
 */
export type GitObjectStorage = IMMap<GitObjectAddress, GitObject>;
