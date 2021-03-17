import { IndexFile } from './index-file/types';
import ObjectStorage from './object-storage';
import { GitObjectAddress } from './object-storage/types';
import RefStorage, { RefPath } from './ref-storage';

// Detached head - points to commit object
interface DetachedHead {
  isDetached: true;
  destination: GitObjectAddress;
}

// Stable head - points to local ref
interface StableHead {
  isDetached: false;
  destination: RefPath;
}

/**
 * Represents Git HEAD. Can be
 * - stable (pointing towards local ref)
 * - detached (pointing directly to commit)
 */
export type GitHead = StableHead | DetachedHead;

/**
 * Represents the Git repository of a single sandbox.
 */
export interface GitRepository {
  objectStorage: ObjectStorage;
  refStorage: RefStorage;
  indexFile: IndexFile;
  head: GitHead;
}
