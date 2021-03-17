import * as Index from './index';
import * as FS from '../../file-system';
import { FileBlob, FileSystemPath } from '../../file-system';
import { createSampleFS } from '../../file-system/index.test';
import { createObjectStorage } from '../object-storage';
import { hashBlobObject } from '../object-storage/hash-object';
import { IndexFile, IndexFileItem } from './types';
import { SortedArrayItem } from '../../utils/sorted-array';

// Utility type: single item of indexFile.items SortedArray
type IndexArrayItem = SortedArrayItem<FileSystemPath, IndexFileItem>;

const createSampleIndex = () => {
  const objectStorage = createObjectStorage();
  const fs = createSampleFS();
  const { indexFile, storage } = Index.createIndexFromFileTree(
    fs._tree,
    objectStorage
  );
  return { indexFile, objectStorage: storage, fs };
};

test('Create index from file tree', () => {
  const { indexFile, fs } = createSampleIndex();
  const indexItems = indexFile._items;

  // 4 files -> 4 index entries
  expect(indexItems.size).toBe(4);

  // Check if the index entries are right
  const indexItem0 = indexItems.get(0) as IndexArrayItem;
  expect(indexItem0.key).toStrictEqual(['dir1', 'dir2', 'file3']);
  const file3 = FS.getItemAt(fs, ['dir1', 'dir2', 'file3']) as FileBlob;
  const file3Hash = hashBlobObject({ type: 'blob', fileData: file3 });
  expect(indexItem0.value.objectHash).toBe(file3Hash);

  const indexItem1 = indexItems.get(1) as IndexArrayItem;
  expect(indexItem1.key).toStrictEqual(['dir1', 'file1']);
  const file1 = FS.getItemAt(fs, ['dir1', 'file1']) as FileBlob;
  const file1Hash = hashBlobObject({ type: 'blob', fileData: file1 });
  expect(indexItem1.value.objectHash).toBe(file1Hash);

  const indexItem2 = indexItems.get(2) as IndexArrayItem;
  expect(indexItem2.key).toStrictEqual(['dir1', 'file2']);
  const file2 = FS.getItemAt(fs, ['dir1', 'file2']) as FileBlob;
  const file2Hash = hashBlobObject({ type: 'blob', fileData: file2 });
  expect(indexItem2.value.objectHash).toBe(file2Hash);

  const indexItem3 = indexItems.get(3) as IndexArrayItem;
  expect(indexItem3.key).toStrictEqual(['file4']);
  const file4 = FS.getItemAt(fs, ['file4']) as FileBlob;
  const file4Hash = hashBlobObject({ type: 'blob', fileData: file4 });
  expect(indexItem3.value.objectHash).toBe(file4Hash);
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
  const sample = { objectHash: 'foo' };

  // Can't have index entry at root
  expect(Index.upsert(indexFile, [], sample)).toBeNull();

  // Regular work day: update entry for file under root
  const newIndex1 = Index.upsert(indexFile, ['file4'], sample) as IndexFile;
  expect(newIndex1).not.toBeNull();
  expect(Index.getEntry(newIndex1, ['file4'])?.objectHash).toBe('foo');

  // Regular work day: update entry for file at nested path
  const newIndex2 = Index.upsert(
    indexFile,
    ['dir1', 'file2'],
    sample
  ) as IndexFile;
  expect(newIndex2).not.toBeNull();
  expect(Index.getEntry(newIndex2, ['dir1', 'file2'])?.objectHash).toBe('foo');

  // Regular work day: upSERT entry for new file inside new directory
  const newIndex3 = Index.upsert(
    indexFile,
    ['dir3', 'file5'],
    sample
  ) as IndexFile;
  expect(newIndex3).not.toBeNull();
  expect(Index.getEntry(newIndex3, ['dir3', 'file5'])?.objectHash).toBe('foo');
});

test('Remove index entry', () => {
  const { indexFile } = createSampleIndex();

  // There are no entries at root, so this should fail
  expect(Index.remove(indexFile, [])).toBeNull();
  // Index entries that don't exist, can't be removed
  expect(Index.remove(indexFile, ['dir1'])).toBeNull();

  // Regular work day: remove index entry for file under root
  const newIndex1 = Index.remove(indexFile, ['file4']) as IndexFile;
  expect(newIndex1).not.toBeNull();
  expect(Index.getEntry(newIndex1, ['file4'])).toBeNull();

  // Regular work day: remove index entry for file at nested path
  const newIndex2 = Index.remove(indexFile, ['dir1', 'file1']) as IndexFile;
  expect(newIndex2).not.toBeNull();
  expect(Index.getEntry(newIndex2, ['dir1', 'file1'])).toBeNull();
});

test('Get path section of index file', () => {
  const { indexFile } = createSampleIndex();

  // Regular work day: return "prospective" section for non-existent paths
  const section1 = Index.getPathSection(indexFile, ['dir2']);
  expect(section1.start).toBe(3);
  expect(section1.end).toBe(3);

  // Regular work day: Section limits for directory
  const section2 = Index.getPathSection(indexFile, ['dir1']);
  expect(section2.start).toBe(0);
  expect(section2.end).toBe(3);

  // Regular work day: Section for single file
  const section3 = Index.getPathSection(indexFile, ['file4']);
  expect(section3.start).toBe(3);
  expect(section3.end).toBe(4);
});
