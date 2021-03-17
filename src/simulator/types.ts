import FileSystem from './file-system';
import { GitRepository } from './git-repository/types';

/**
 * Represents the system state of a single sandbox.
 */
export interface SandboxState {
  fileSystem: FileSystem;
  repository: GitRepository;
}

/**
 * Represents a single sandbox, along with its metadata
 * like name and creation time.
 */
export interface Sandbox {
  name: string;
  createdAt: Date;
  sandboxState: SandboxState;
}
