import GitHead from './head';
import IndexFile from './index-file';
import ObjectStorage from './object-storage';
import RefStorage from './ref-storage';
import { GitRepository } from './types';

export const createNewRepository = (): GitRepository => {
  return {
    indexFile: new IndexFile(),
    objectStorage: new ObjectStorage(),
    refStorage: new RefStorage(),
    head: new GitHead(),
  };
};
