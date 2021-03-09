import { createEmptyIndex } from './index-file';
import { createObjectStorage } from './object-storage';
import { createRefStorage } from './ref-storage';
import { GitRepository } from './types';

export * as IndexFile from './index-file';
export * as ObjectStorage from './object-storage';
export * as RefStorage from './ref-storage';

export const createNewRepository = (): GitRepository => {
  return {
    indexFile: createEmptyIndex(),
    objectStorage: createObjectStorage(),
    refStorage: createRefStorage(),
    head: {
      isDetached: true,
      // @todo HEAD value for new repo?
      destination: '',
    },
  };
};
