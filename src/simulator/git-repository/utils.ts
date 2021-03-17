import { GitObjectAddress } from './object-storage/types';
import RefStorage from './ref-storage';
import { GitHead } from './types';

/**
 * Returns the hash address of the commit that
 * HEAD is currently pointing to.
 */
export const getHeadCommit = (
  head: GitHead,
  refStorage: RefStorage
): GitObjectAddress => {
  // Detached head directly points to commit
  if (head.isDetached) return head.destination;
  // Stable head points to ref, which points to commit
  const refAddress = head.destination;
  const refLeaf = refStorage.readLeaf(refAddress);
  if (!refLeaf) throw new Error('HEAD ref points to invalid commit!');
  return refLeaf;
};

/**
 * Updates the current HEAD to a new commit hash.
 * If HEAD is stable (not detached), updates ref.
 *
 * Fails and returns `null`, if stable HEAD does not
 * point to a valid ref.
 */
export const updateHead = (
  head: GitHead,
  refStorage: RefStorage,
  commitHash: GitObjectAddress
): RefStorage | null => {
  if (head.isDetached) {
    // Detached head: update directly
    head.destination = commitHash;
    return refStorage;
  } else {
    // Stable head: update the ref pointed to by head
    const refAddress = head.destination;
    return refStorage.update(refAddress, commitHash);
  }
};
