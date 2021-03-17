import { createEmptyIndex } from './index-file';
import ObjectStorage from './object-storage';
import { createRefStorage } from './ref-storage';
import { GitRepository } from './types';

export const createNewRepository = (): GitRepository => {
  return {
    indexFile: createEmptyIndex(),
    objectStorage: new ObjectStorage(),
    refStorage: createRefStorage(),
    head: {
      isDetached: true,
      // @todo HEAD value for new repo?
      destination: '',
    },
  };
};
