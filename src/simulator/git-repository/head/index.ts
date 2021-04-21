import { Record } from 'immutable';
import { DEFAULT_BRANCH_NAME } from '../../constants';
import { GitObjectAddress } from '../object-storage/types';
import RefStorage, { RefPath } from '../ref-storage';

// Detached head - points to commit object
interface DetachedHeadState {
  isDetached: true;
  destination: GitObjectAddress;
}

// Stable head - points to local ref
interface StableHeadState {
  isDetached: false;
  destination: RefPath;
}

// State of Git HEAD
const CreateGitHead = Record<DetachedHeadState | StableHeadState>({
  isDetached: false,
  destination: [DEFAULT_BRANCH_NAME],
});
const defaultGitHead = CreateGitHead();
export type GitHeadState = typeof defaultGitHead;

/**
 * Represents Git HEAD. Can be
 * - stable (pointing towards local ref)
 * - detached (pointing directly to commit)
 */
export default class GitHead {
  _head: GitHeadState;

  /**
   * Create a fresh Git HEAD, optionally with
   * provided initial HEAD state.
   */
  constructor(head?: GitHeadState) {
    if (head) this._head = head;
    else this._head = CreateGitHead();
  }

  /**
   * Immutability helper method: use this to return GitHead
   * instance with updated head state.
   */
  private updatedClass = (newHead: GitHeadState): GitHead => {
    if (newHead === this._head) return this;
    else return new GitHead(newHead);
  };

  /**
   * Detach HEAD to the provided commit address.
   */
  detachTo(commitAddr: GitObjectAddress): GitHead {
    const newHead = this._head
      .set('isDetached', true)
      .set('destination', commitAddr);
    return this.updatedClass(newHead);
  }

  /**
   * Update HEAD to point to the provided ref.
   */
  attachTo(branchPath: RefPath): GitHead {
    const newHead = this._head
      .set('isDetached', false)
      .set('destination', branchPath);
    return this.updatedClass(newHead);
  }

  /**
   * Update HEAD to the provided commit hash or ref.
   * If commit hash is provided, resultant head is detached.
   */
  updateTo(target: GitObjectAddress | RefPath): GitHead {
    const targetIsRef = Array.isArray(target);
    const newHead = this._head
      .set('isDetached', !targetIsRef)
      .set('destination', target);
    return this.updatedClass(newHead);
  }

  /**
   * Advance the current HEAD or active branch to provided
   * commit hash. Used for updating head after new commit.
   *
   * @todo Move to RefStorage+Head class?
   */
  advanceTo(
    refStorage: RefStorage,
    commitHash: GitObjectAddress
  ): { head: GitHead; refStorage: RefStorage } {
    if (this._head.isDetached) {
      const newHead = this.detachTo(commitHash);
      return { refStorage, head: newHead };
    } else {
      const branchName = this._head.destination;
      const newRefStorage = refStorage.update(branchName, commitHash);
      return { refStorage: newRefStorage, head: this };
    }
  }

  /**
   * Get the hash of the commit pointed to by current HEAD.
   *
   * @todo Move to RefStorage+Head class?
   */
  getTargetCommit(refStorage: RefStorage): GitObjectAddress {
    if (this._head.isDetached) return this._head.destination;
    else return refStorage.readLeaf(this._head.destination);
  }
}
