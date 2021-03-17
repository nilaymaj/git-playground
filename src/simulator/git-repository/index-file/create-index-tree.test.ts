import { createIndexTree } from './create-index-tree';
import * as Index from './index';
import { createSampleFS } from '../../file-system/index.test';
import ObjectStorage from '../object-storage';
import Tree from '../../utils/tree';
import { IndexFileItem } from './types';

const validIndexFile = () => {
  const fs = createSampleFS();
  const objectStorage = new ObjectStorage();
  return Index.createIndexFromFileTree(fs._fs._tree, objectStorage).indexFile;
};

const invalidIndexFile = () => {
  const fs = createSampleFS();
  const objectStorage = new ObjectStorage();
  const { indexFile } = Index.createIndexFromFileTree(
    fs._fs._tree,
    objectStorage
  );
  const newIndex = Index.upsert(indexFile, ['dir1', 'file1', 'file5'], {
    objectHash: 'foo',
  });
  if (!newIndex) throw new Error(`This shouldn't happen.`);
  return newIndex;
};

test('Valid index file -> index tree', () => {
  const indexFile = validIndexFile();

  expect(() => createIndexTree(indexFile)).not.toThrow();
  const indexTree = createIndexTree(indexFile);

  const file1 = indexTree.get(['dir1', 'file1']) as IndexFileItem;
  expect(file1).not.toBeNull();
  expect(Tree.isLeafNode(file1)).toBe(true);

  const file2 = indexTree.get(['dir1', 'file2']) as IndexFileItem;
  expect(file2).not.toBeNull();
  expect(Tree.isLeafNode(file2)).toBe(true);

  const file3 = indexTree.get(['dir1', 'dir2', 'file3']) as IndexFileItem;
  expect(file3).not.toBeNull();
  expect(Tree.isLeafNode(file3)).toBe(true);

  const file4 = indexTree.get(['file4']) as IndexFileItem;
  expect(file4).not.toBeNull();
  expect(Tree.isLeafNode(file4)).toBe(true);
});

test('Invalid index file -> error', () => {
  const invalidIndex = invalidIndexFile();
  expect(() => createIndexTree(invalidIndex)).toThrow();
});
