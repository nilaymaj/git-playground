import { hashObject } from './hash-object';
import { GitObjectStorage, GitObject, GitObjectAddress } from './types';

/**
 * The object storage is a database where Git objects are
 * stored against their SHA-1 hash. These objects include:
 * - blobs: represent the contents and metadata of a single file
 * - trees: represent a directory of blobs and further trees
 * - commits: represent a single commit, consisting
 *   - commit message
 *   - time of committing
 *   - SHA-1 of the parent commit
 *   - SHA-1 of the corresponding work tree
 *
 * The object storage is:
 * - content-addressable: if you have the object, you can find its key using SHA-1
 * - key-value: Objects are stored against their keys, which are SHA-1 hashes
 * - a graph:
 *   - commits point to trees and parent commits
 *   - trees point to blobs and subtrees
 *   - blobs are leafs of the graph
 */

/**
 * Create an empty instance of Git object storage
 */
export const createObjectStorage = (): GitObjectStorage => {
  return new Map();
};

/**
 * Fetches object stored at given hash in storage.
 * Returns `null` if object does not exist.
 */
export const readObject = (
  storage: GitObjectStorage,
  hash: GitObjectAddress
): GitObject | null => {
  const object = storage.get(hash);
  if (!object) return null;
  else return object;
};

/**
 * Hashes and stores given object in the object storage.
 * Returns SHA-1 hash of the stored object.
 */
export const writeObject = (
  storage: GitObjectStorage,
  object: GitObject
): GitObjectAddress => {
  const hash = hashObject(object);
  storage.set(hash, object);
  return hash;
};

/**
 * Deletes object at given hash from storage
 * Returns true on success, fails if object does not exist
 */
export const deleteObject = (
  storage: GitObjectStorage,
  hash: GitObjectAddress
): boolean => {
  return storage.delete(hash);
};
