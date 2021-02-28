import { createHash, Hash } from 'crypto';
import {
  GitObject,
  GitObjectAddress,
  GitBlob,
  GitTree,
  GitCommit,
} from './types';

const HASH_METHOD = 'sha1';

/**
 * Computes the SHA-1 hash of a given Git object
 */
export const hashObject = (object: GitObject): GitObjectAddress => {
  if (object.type === 'blob') return hashBlobObject(object);
  else if (object.type === 'tree') return hashTreeObject(object);
  else return hashCommitObject(object);
};

/**
 * Computes the SHA-1 hash of a Git blob object
 */
export const hashBlobObject = (blob: GitBlob): GitObjectAddress => {
  const { contentToken, version } = blob.fileData.contents;
  const finalToken = contentToken + ' ' + version.toString();
  return createHash(HASH_METHOD).update(finalToken).digest('hex');
};

/**
 * Computes the SHA-1 hash of a Git tree object
 */
export const hashTreeObject = (tree: GitTree): GitObjectAddress => {
  return Array.from(tree.items)
    .reduce<Hash>((currentHash: Hash, [fileName, hashPath]) => {
      // Serialize item to string and update hash
      const itemString = fileName + '|' + hashPath;
      return currentHash.update(itemString);
    }, createHash(HASH_METHOD))
    .digest('hex');
};

/**
 * Computes the SHA-1 hash of a Git commit object
 */
export const hashCommitObject = (commit: GitCommit): GitObjectAddress => {
  const hasher = createHash(HASH_METHOD);
  hasher.update(commit.message);
  hasher.update(commit.parent || '');
  hasher.update(commit.workTree);
  hasher.update(commit.timestamp.toISOString());
  return hasher.digest('hex');
};
