import FileSystem from '../file-system';
import IndexFile from '../git-repository/index-file';
import ObjectStorage from '../git-repository/object-storage';
import RefStorage from '../git-repository/ref-storage';
import GitHead from '../git-repository/head';
import { SandboxState } from '../types';

/**
 * Utility function to return system with components
 * overridden with provided arguments. Use for aborting
 * commands when returning error.
 */
export const errorState = (
  system: SandboxState,
  fileSystem?: FileSystem | null,
  objectStorage?: ObjectStorage | null,
  indexFile?: IndexFile | null,
  head?: GitHead | null,
  refStorage?: RefStorage | null
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
  objectStorage?: ObjectStorage | null,
  indexFile?: IndexFile | null,
  head?: GitHead | null,
  refStorage?: RefStorage | null
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
