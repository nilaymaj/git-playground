import { FileSystem } from '../file-system/types';
import { IndexFile } from '../git-repository/index-file/types';
import { GitObjectStorage } from '../git-repository/object-storage/types';
import { GitRefStorage } from '../git-repository/ref-storage/types';
import { GitHead } from '../git-repository/types';
import { SandboxState } from '../types';

/**
 * Utility function to return system with components
 * overridden with provided arguments. Use for aborting
 * commands when returning error.
 */
export const errorState = (
  system: SandboxState,
  fileSystem?: FileSystem | null,
  objectStorage?: GitObjectStorage | null,
  indexFile?: IndexFile | null,
  head?: GitHead | null,
  refStorage?: GitRefStorage | null
): { system: SandboxState; success: boolean } => {
  return {
    success: false,
    system: {
      fileSystem: fileSystem || system.fileSystem,
      repository: {
        head: head || system.repository.head,
        objectStorage: objectStorage || system.repository.objectStorage,
        indexFile: indexFile || system.repository.indexFile,
        refStorage: refStorage || system.repository.refStorage,
      },
    },
  };
};

/**
 * Utility function to return system with components
 * overridden with provided arguments. Use for returning
 * final system state after successful command execution.
 */
export const successState = (
  system: SandboxState,
  fileSystem?: FileSystem | null,
  objectStorage?: GitObjectStorage | null,
  indexFile?: IndexFile | null,
  head?: GitHead | null,
  refStorage?: GitRefStorage | null
): { system: SandboxState; success: boolean } => {
  return {
    success: true,
    system: {
      fileSystem: fileSystem || system.fileSystem,
      repository: {
        head: head || system.repository.head,
        objectStorage: objectStorage || system.repository.objectStorage,
        indexFile: indexFile || system.repository.indexFile,
        refStorage: refStorage || system.repository.refStorage,
      },
    },
  };
};
