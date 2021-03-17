import { v4 as uuid } from 'uuid';
import ObjectStorage from './index';
import { GitBlob, GitTree, GitCommit, GitObjectAddress } from './types';
import FileSystem from '../../file-system';

/**
 * Creates a sample unique Git blob object.
 */
const createSampleBlob = (): GitBlob => ({
  type: 'blob',
  fileData: FileSystem.generateFileBlob(),
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
  storage?: ObjectStorage
): { storage: ObjectStorage; tree: GitTree } => {
  const start = storage || new ObjectStorage();
  // Write three random file blobs to storage
  const { storage: s1, hash: h1 } = start.write(createSampleBlob());
  const { storage: s2, hash: h2 } = s1.write(createSampleBlob());
  const { storage: s3, hash: h3 } = s2.write(createSampleBlob());
  // Create and write subtree of required sample tree
  const { storage: s4, hash: h4 } = s3.write({
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
  storage: ObjectStorage,
  tree?: GitObjectAddress
): { storage: ObjectStorage; commit: GitCommit } => {
  const { storage: s1, tree: sampleTree } = createSampleTree(storage);
  const { storage: s2, hash: treeHash } = s1.write(sampleTree);
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
  const storage = new ObjectStorage();

  const blob = createSampleBlob();
  const blobCopy = { ...blob };
  expect(storage.write(blob).hash).toBe(storage.write(blobCopy).hash);

  const { storage: s1, tree } = createSampleTree(storage);
  const treeCopy = { ...tree };
  expect(s1.write(tree).hash).toBe(s1.write(treeCopy).hash);

  const { storage: s2, commit } = createSampleCommit(storage);
  const commitCopy = { ...commit };
  expect(s2.write(commit).hash).toBe(s2.write(commitCopy).hash);
});

test('Different object -> different hash', () => {
  const storage = new ObjectStorage();

  const blob = createSampleBlob();
  const otherBlob = createSampleBlob();
  expect(storage.write(blob)).not.toBe(storage.write(otherBlob));

  const { storage: s11, tree } = createSampleTree(storage);
  const { storage: s12, tree: otherTree } = createSampleTree(storage);
  expect(s11.write(tree).hash).not.toBe(s12.write(otherTree).hash);

  const { storage: s21, commit } = createSampleCommit(storage);
  const { storage: s22, commit: otherCommit } = createSampleCommit(storage);
  expect(s21.write(commit).hash).not.toBe(s22.write(otherCommit).hash);
});

test('Object storage works', () => {
  const storage = new ObjectStorage();

  // Object read and write
  const blob = createSampleBlob();
  const { storage: s1, hash } = storage.write(blob);
  expect(hash).toBeTruthy();
  expect(s1.read('?')).toBeNull();
  expect(s1.read(hash)).toStrictEqual(blob);

  // Deleting non-existent objects is a no-op
  const s2 = s1.delete(hash);
  expect(s2.read(hash)).toBeNull();
});
