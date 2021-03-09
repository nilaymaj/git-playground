import { createFileSystem } from './file-system';
import { createNewRepository } from './git-repository';
import { SandboxState } from './types';

export const createNewSandbox = (): SandboxState => {
  return {
    fileSystem: createFileSystem(),
    repository: createNewRepository(),
  };
};
