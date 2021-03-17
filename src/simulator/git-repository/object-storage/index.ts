import { Map } from 'immutable';
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
export default class ObjectStorage {
  _db: GitObjectStorage;

  constructor(db?: GitObjectStorage) {
    if (db) this._db = db;
    else this._db = Map();
  }

  /**
   * Immutability helper method: use this to return ObjectStorage
   * instance with updated object database.
   */
  private updatedClass = (db: GitObjectStorage): ObjectStorage => {
    if (this._db === db) return this;
    else return new ObjectStorage(db);
  };

  /**
   * Read an object located in object storage.
   */
  read = (hash: GitObjectAddress): GitObject | null => {
    return this._db.get(hash, null);
  };

  /**
   * Write a new object to the object storage.
   * Does nothing if object already exists.
   */
  write = (
    object: GitObject
  ): { storage: ObjectStorage; hash: GitObjectAddress } => {
    const hash = hashObject(object);
    const newDB = this._db.set(hash, object);
    return { storage: this.updatedClass(newDB), hash };
  };

  /**
   * Delete an object from object storage.
   * Does nothing if object does not exist.
   */
  delete = (hash: GitObjectAddress): ObjectStorage => {
    if (!this._db.has(hash)) return this;
    const newDB = this._db.delete(hash);
    return this.updatedClass(newDB);
  };
}
