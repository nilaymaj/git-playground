import * as Index from './index';
import * as FS from '../../file-system';
import { FileBlob } from '../../file-system/types';
import { createSampleFS } from '../../file-system/index.test';
import { createObjectStorage } from '../object-storage';
import { hashBlobObject } from '../object-storage/hash-object';

const createSampleIndex = () => {
  const objectStorage = createObjectStorage();
  const fs = createSampleFS();
  const indexFile = Index.createIndexFromFileTree(fs, objectStorage);
  return { indexFile, objectStorage, fs };
};

test('Create index from file tree', () => {
  const { indexFile, fs } = createSampleIndex();
  const indexItems = indexFile.items;

  // 4 files -> 4 index entries
  expect(indexItems.length).toBe(4);

  // Check if the index entries are right
  expect(indexItems[0].key).toStrictEqual(['dir1', 'dir2', 'file3']);
  const file3 = FS.getItemAt(fs, ['dir1', 'dir2', 'file3']) as FileBlob;
  const file3Hash = hashBlobObject({ type: 'blob', fileData: file3 });
  expect(indexItems[0].value.objectHash).toBe(file3Hash);

  expect(indexItems[1].key).toStrictEqual(['dir1', 'file1']);
  const file1 = FS.getItemAt(fs, ['dir1', 'file1']) as FileBlob;
  const file1Hash = hashBlobObject({ type: 'blob', fileData: file1 });
  expect(indexItems[1].value.objectHash).toBe(file1Hash);

  expect(indexItems[2].key).toStrictEqual(['dir1', 'file2']);
  const file2 = FS.getItemAt(fs, ['dir1', 'file2']) as FileBlob;
  const file2Hash = hashBlobObject({ type: 'blob', fileData: file2 });
  expect(indexItems[2].value.objectHash).toBe(file2Hash);

  expect(indexItems[3].key).toStrictEqual(['file4']);
  const file4 = FS.getItemAt(fs, ['file4']) as FileBlob;
  const file4Hash = hashBlobObject({ type: 'blob', fileData: file4 });
  expect(indexItems[3].value.objectHash).toBe(file4Hash);
});

test('Get index entry', () => {
  const { indexFile, fs } = createSampleIndex();

  // Return `null` for non-existent entries
  expect(Index.getEntry(indexFile, [])).toBeNull();
  expect(Index.getEntry(indexFile, ['?'])).toBeNull();
  expect(Index.getEntry(indexFile, ['dir1', '?'])).toBeNull();

  // Regular work day: get index entry for file under root
  const file4 = FS.getItemAt(fs, ['file4']) as FileBlob;
  const file4Hash = hashBlobObject({ type: 'blob', fileData: file4 });
  const indexEntry4 = Index.getEntry(indexFile, ['file4']);
  expect(indexEntry4?.objectHash).toBe(file4Hash);

  // Regular work day: get index entry for file at nested path
  const file1 = FS.getItemAt(fs, ['dir1', 'file1']) as FileBlob;
  const file1Hash = hashBlobObject({ type: 'blob', fileData: file1 });
  const indexEntry1 = Index.getEntry(indexFile, ['dir1', 'file1']);
  expect(indexEntry1?.objectHash).toBe(file1Hash);
});

test('Upsert entry at path', () => {
  const { indexFile } = createSampleIndex();
  const sampleEntry = { lastModified: new Date(), objectHash: 'foo' };

  // Can't have index entry at root
  expect(Index.upsert(indexFile, [], sampleEntry)).toBe(false);

  // Regular work day: update entry for file under root
  expect(Index.upsert(indexFile, ['file4'], sampleEntry)).toBe(true);
  expect(Index.getEntry(indexFile, ['file4'])?.objectHash).toBe('foo');

  // Regular work day: update entry for file at nested path
  expect(Index.upsert(indexFile, ['dir1', 'file2'], sampleEntry)).toBe(true);
  expect(Index.getEntry(indexFile, ['dir1', 'file2'])?.objectHash).toBe('foo');

  // Regular work day: upSERT entry for new file inside new directory
  expect(Index.upsert(indexFile, ['dir3', 'file5'], sampleEntry)).toBe(true);
  expect(Index.getEntry(indexFile, ['dir3', 'file5'])?.objectHash).toBe('foo');
});

test('Remove index entry', () => {
  const { indexFile } = createSampleIndex();

  // There are no entries at root, so this should fail
  expect(Index.remove(indexFile, [])).toBe(false);
  // Index entries that don't exist, can't be removed
  expect(Index.remove(indexFile, ['dir1'])).toBe(false);

  // Regular work day: remove index entry for file under root
  expect(Index.remove(indexFile, ['file4'])).toBe(true);
  expect(Index.getEntry(indexFile, ['file4'])).toBe(null);

  // Regular work day: remove index entry for file at nested path
  expect(Index.remove(indexFile, ['dir1', 'file1'])).toBe(true);
  expect(Index.getEntry(indexFile, ['dir1', 'file1'])).toBe(null);
});
