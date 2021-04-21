import GitHead from './head';
import IndexFile from './index-file';
import ObjectStorage from './object-storage';
import RefStorage from './ref-storage';

/**
 * Represents the Git repository of a single sandbox.
 */
export interface GitRepository {
  objectStorage: ObjectStorage;
  refStorage: RefStorage;
  indexFile: IndexFile;
  head: GitHead;
}
