import { createEmptyIndex } from './index-file';
import ObjectStorage from './object-storage';
import RefStorage from './ref-storage';
import { GitRepository } from './types';

export const createNewRepository = (): GitRepository => {
  return {
    indexFile: createEmptyIndex(),
    objectStorage: new ObjectStorage(),
    refStorage: new RefStorage(),
    head: {
      isDetached: true,
      // @todo HEAD value for new repo?
      destination: '',
    },
  };
};
