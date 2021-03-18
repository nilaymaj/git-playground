import IndexFile from './index';
import { FileBlob } from '../../file-system';
import { createSampleFS } from '../../file-system/index.test';
import ObjectStorage from '../object-storage';
import { hashBlobObject } from '../object-storage/hash-object';
import { InvalidArgError } from '../../utils/errors';

const createSampleIndex = () => {
  const objectStorage = new ObjectStorage();
  const fs = createSampleFS();
  const { indexFile, storage } = IndexFile.fromFileTree(
    fs._fs._tree,
    objectStorage
  );
  return { indexFile, objectStorage: storage, fs };
};

test('Create index from file tree', () => {
  const { indexFile, fs } = createSampleIndex();
  const indexItems = indexFile.entries();

  // 4 files -> 4 index entries
  expect(indexFile.size()).toBe(4);
  expect(indexItems.length).toBe(4);

  // Check if the index entries are right
  const indexItem0 = indexItems[0];
  expect(indexItem0.path).toStrictEqual(['dir1', 'dir2', 'file3']);
  const file3 = fs.get(['dir1', 'dir2', 'file3']) as FileBlob;
  const file3Hash = hashBlobObject({ type: 'blob', fileData: file3 });
  expect(indexItem0.entry.objectHash).toBe(file3Hash);

  const indexItem1 = indexItems[1];
  expect(indexItem1.path).toStrictEqual(['dir1', 'file1']);
  const file1 = fs.get(['dir1', 'file1']) as FileBlob;
  const file1Hash = hashBlobObject({ type: 'blob', fileData: file1 });
  expect(indexItem1.entry.objectHash).toBe(file1Hash);

  const indexItem2 = indexItems[2];
  expect(indexItem2.path).toStrictEqual(['dir1', 'file2']);
  const file2 = fs.get(['dir1', 'file2']) as FileBlob;
  const file2Hash = hashBlobObject({ type: 'blob', fileData: file2 });
  expect(indexItem2.entry.objectHash).toBe(file2Hash);

  const indexItem3 = indexItems[3];
  expect(indexItem3.path).toStrictEqual(['file4']);
  const file4 = fs.get(['file4']) as FileBlob;
  const file4Hash = hashBlobObject({ type: 'blob', fileData: file4 });
  expect(indexItem3.entry.objectHash).toBe(file4Hash);
});

test('Get index entry', () => {
  const { indexFile, fs } = createSampleIndex();

  // Throw error if empty path is provided
  expect(() => indexFile.get([])).toThrowError(InvalidArgError);
  // Return `null` for non-existent entries
  expect(indexFile.get(['?'])).toBeNull();
  expect(indexFile.get(['dir1', '?'])).toBeNull();

  // Regular work day: get index entry for file under root
  const file4 = fs.get(['file4']) as FileBlob;
  const file4Hash = hashBlobObject({ type: 'blob', fileData: file4 });
  const indexEntry4 = indexFile.get(['file4']);
  expect(indexEntry4?.objectHash).toBe(file4Hash);

  // Regular work day: get index entry for file at nested path
  const file1 = fs.get(['dir1', 'file1']) as FileBlob;
  const file1Hash = hashBlobObject({ type: 'blob', fileData: file1 });
  const indexEntry1 = indexFile.get(['dir1', 'file1']);
  expect(indexEntry1?.objectHash).toBe(file1Hash);
});

test('Upsert entry at path', () => {
  const { indexFile } = createSampleIndex();
  const sample = { objectHash: 'foo' };

  // Can't have index entry at root
  expect(() => indexFile.upsert([], sample)).toThrowError(InvalidArgError);

  // Regular work day: update entry for file under root
  const newIndex1 = indexFile.upsert(['file4'], sample);
  expect(newIndex1.get(['file4'])?.objectHash).toBe('foo');

  // Regular work day: update entry for file at nested path
  const newIndex2 = indexFile.upsert(['dir1', 'file2'], sample);
  expect(newIndex2.get(['dir1', 'file2'])?.objectHash).toBe('foo');

  // Regular work day: upSERT entry for new file inside new directory
  const newIndex3 = indexFile.upsert(['dir3', 'file5'], sample);
  expect(newIndex3.get(['dir3', 'file5'])?.objectHash).toBe('foo');
});

test('Remove index entry', () => {
  const { indexFile } = createSampleIndex();

  // There are no entries at root, so this should fail
  expect(() => indexFile.remove([])).toThrowError(InvalidArgError);
  // Index entries that don't exist, can't be removed
  expect(() => indexFile.remove(['dir1'])).toThrowError(InvalidArgError);

  // Regular work day: remove index entry for file under root
  const newIndex1 = indexFile.remove(['file4']);
  expect(newIndex1.get(['file4'])).toBeNull();

  // Regular work day: remove index entry for file at nested path
  const newIndex2 = indexFile.remove(['dir1', 'file1']);
  expect(newIndex2.get(['dir1', 'file1'])).toBeNull();
});

test('Get path section of index file', () => {
  const { indexFile } = createSampleIndex();

  // Regular work day: return "prospective" section for non-existent paths
  const section1 = indexFile.getPathSection(['dir2']);
  expect(section1.start).toBe(3);
  expect(section1.end).toBe(3);

  // Regular work day: Section limits for directory
  const section2 = indexFile.getPathSection(['dir1']);
  expect(section2.start).toBe(0);
  expect(section2.end).toBe(3);

  // Regular work day: Section for single file
  const section3 = indexFile.getPathSection(['file4']);
  expect(section3.start).toBe(3);
  expect(section3.end).toBe(4);
});
