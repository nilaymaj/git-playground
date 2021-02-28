import { v4 as uuid } from 'uuid';
import {
  createObjectStorage,
  readObject,
  writeObject,
  deleteObject,
} from './index';
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
const createSampleTree = (storage: GitObjectStorage): GitTree => {
  const a = writeObject(storage, {
    type: 'tree',
    items: new Map([
      [uuid(), writeObject(storage, createSampleBlob())],
      [uuid(), writeObject(storage, createSampleBlob())],
    ]),
  });
  return {
    type: 'tree',
    items: new Map([
      [uuid(), a],
      [uuid(), writeObject(storage, createSampleBlob())],
    ]),
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
): GitCommit => ({
  type: 'commit',
  message: uuid(),
  timestamp: new Date(),
  parent: uuid(),
  workTree: tree || writeObject(storage, createSampleTree(storage)),
});

test('Same object -> same hash', () => {
  const storage = createObjectStorage();

  const blob = createSampleBlob();
  const blobCopy = { ...blob };
  expect(writeObject(storage, blob)).toBe(writeObject(storage, blobCopy));

  const tree = createSampleTree(storage);
  const treeCopy = { ...tree };
  expect(writeObject(storage, tree)).toBe(writeObject(storage, treeCopy));

  const commit = createSampleCommit(storage);
  const commitCopy = { ...commit };
  expect(writeObject(storage, commit)).toBe(writeObject(storage, commitCopy));
});

test('Different object -> different hash', () => {
  const storage = createObjectStorage();

  const blob = createSampleBlob();
  const otherBlob = createSampleBlob();
  expect(writeObject(storage, blob)).not.toBe(writeObject(storage, otherBlob));

  const tree = createSampleTree(storage);
  const otherTree = createSampleTree(storage);
  expect(writeObject(storage, tree)).not.toBe(writeObject(storage, otherTree));

  const commit = createSampleCommit(storage);
  const otherCommit = createSampleCommit(storage);
  expect(writeObject(storage, commit)).not.toBe(
    writeObject(storage, otherCommit)
  );
});

test('Object storage works', () => {
  const storage = createObjectStorage();

  // Object read and write
  const blob = createSampleBlob();
  const hash = writeObject(storage, blob);
  expect(hash).toBeTruthy();
  expect(readObject(storage, '?')).toBe(null);
  expect(readObject(storage, hash)).toStrictEqual(blob);

  // Object deletion
  expect(deleteObject(storage, '?')).toBe(false);
  expect(deleteObject(storage, hash)).toBe(true);
});
