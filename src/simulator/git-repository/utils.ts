import { GitObjectAddress } from './object-storage/types';
import { readRefAt, updateRefAt } from './ref-storage';
import { GitRefStorage } from './ref-storage/types';
import { GitHead } from './types';

/**
 * Returns the hash address of the commit that
 * HEAD is currently pointing to.
 */
export const getHeadCommit = (
  head: GitHead,
  refStorage: GitRefStorage
): GitObjectAddress => {
  // Detached head directly points to commit
  if (head.isDetached) return head.destination;
  // Stable head points to ref, which points to commit
  const refAddress = head.destination;
  const refLeaf = readRefAt(refStorage, refAddress);
  if (!refLeaf) throw new Error('HEAD ref points to invalid commit!');
  return refLeaf;
};

/**
 * Updates the current HEAD to a new commit hash.
 * If HEAD is stable (not detached), updates ref.
 */
export const updateHead = (
  head: GitHead,
  refStorage: GitRefStorage,
  commitHash: GitObjectAddress
): boolean => {
  if (head.isDetached) {
    // Detached head: update directly
    head.destination = commitHash;
    return true;
  } else {
    // Stable head: update the ref pointed to by head
    const refAddress = head.destination;
    return updateRefAt(refStorage, refAddress, commitHash);
  }
};
