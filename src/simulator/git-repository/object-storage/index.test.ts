import { v4 as uuid } from 'uuid';
import * as Obj from './index';
import {
  GitBlob,
  GitTree,
  GitCommit,
  GitObjectStorage,
  GitObjectAddress,
} from './types';
import { generateFileBlob } from '../../file-system';

/**
 * Creates a sample unique Git blob object.
 */
const createSampleBlob = (): GitBlob => ({
  type: 'blob',
  fileData: generateFileBlob(),
});

/**
 * Creates a sample Git tree object. Requires an object storage
 * instance to store subtrees of the created tree. The created
 * tree is not written to storage.
 *
 * Each generated tree has the same structure, and tree uniqueness
 * arises from randomly generated branch names and leaf values.
 */
const createSampleTree = (
  storage?: GitObjectStorage
): { storage: GitObjectStorage; tree: GitTree } => {
  const start = storage || Obj.createObjectStorage();
  // Write three random file blobs to storage
  const { storage: s1, hash: h1 } = Obj.writeObject(start, createSampleBlob());
  const { storage: s2, hash: h2 } = Obj.writeObject(s1, createSampleBlob());
  const { storage: s3, hash: h3 } = Obj.writeObject(s2, createSampleBlob());
  // Create and write subtree of required sample tree
  const { storage: s4, hash: h4 } = Obj.writeObject(s3, {
    type: 'tree',
    items: new Map([
      [uuid(), h1],
      [uuid(), h2],
    ]),
  });
  // Create and return the required sample tree
  return {
    storage: s4,
    tree: {
      type: 'tree',
      items: new Map([
        [uuid(), h3],
        [uuid(), h4],
      ]),
    },
  };
};

/**
 * Creates a sample Git commit object. If `tree` is not provided, creates a
 * new work tree and stores it to provided object storage. The created
 * commit object is not written to storage.
 *
 * Each generated commit differs both in metadata and generated work tree.
 */
const createSampleCommit = (
  storage: GitObjectStorage,
  tree?: GitObjectAddress
): { storage: GitObjectStorage; commit: GitCommit } => {
  const { storage: s1, tree: sampleTree } = createSampleTree(storage);
  const { storage: s2, hash: treeHash } = Obj.writeObject(s1, sampleTree);
  return {
    storage: s2,
    commit: {
      type: 'commit',
      message: uuid(),
      timestamp: new Date(),
      parent: uuid(),
      workTree: tree || treeHash,
    },
  };
};

test('Same object -> same hash', () => {
  const storage = Obj.createObjectStorage();

  const blob = createSampleBlob();
  const blobCopy = { ...blob };
  expect(Obj.writeObject(storage, blob).hash).toBe(
    Obj.writeObject(storage, blobCopy).hash
  );

  const { storage: s1, tree } = createSampleTree(storage);
  const treeCopy = { ...tree };
  expect(Obj.writeObject(s1, tree).hash).toBe(
    Obj.writeObject(s1, treeCopy).hash
  );

  const { storage: s2, commit } = createSampleCommit(storage);
  const commitCopy = { ...commit };
  expect(Obj.writeObject(s2, commit).hash).toBe(
    Obj.writeObject(s2, commitCopy).hash
  );
});

test('Different object -> different hash', () => {
  const storage = Obj.createObjectStorage();

  const blob = createSampleBlob();
  const otherBlob = createSampleBlob();
  expect(Obj.writeObject(storage, blob)).not.toBe(
    Obj.writeObject(storage, otherBlob)
  );

  const { storage: s11, tree } = createSampleTree(storage);
  const { storage: s12, tree: otherTree } = createSampleTree(storage);
  expect(Obj.writeObject(s11, tree).hash).not.toBe(
    Obj.writeObject(s12, otherTree).hash
  );

  const { storage: s21, commit } = createSampleCommit(storage);
  const { storage: s22, commit: otherCommit } = createSampleCommit(storage);
  expect(Obj.writeObject(s21, commit).hash).not.toBe(
    Obj.writeObject(s22, otherCommit).hash
  );
});

test('Object storage works', () => {
  const storage = Obj.createObjectStorage();

  // Object read and write
  const blob = createSampleBlob();
  const { storage: s1, hash } = Obj.writeObject(storage, blob);
  expect(hash).toBeTruthy();
  expect(Obj.readObject(s1, '?')).toBe(null);
  expect(Obj.readObject(s1, hash)).toStrictEqual(blob);

  // Object deletion
  expect(Obj.deleteObject(storage, '?')).toBeNull();
  const s2 = Obj.deleteObject(s1, hash) as GitObjectStorage;
  expect(s2).not.toBeNull();
  expect(Obj.readObject(s2, hash)).toBeNull();
});
