import * as FS from './index';
import { FileSystem, FileBlob, FileSystemInternalNode } from './types';
import * as Tree from '../utils/tree';

/**
 * Creates a sample file system with following files:
 * ```
 * - dir1/file1
 * - dir1/file2
 * - dir1/dir2/file3
 * - file4
 * ```
 */
export const createSampleFS = (): FileSystem => {
  const fs = FS.createFileSystem();
  Tree.insertLeafAt(fs, ['dir1', 'file1'], FS.generateFileBlob('f1'));
  Tree.insertLeafAt(fs, ['dir1', 'file2'], FS.generateFileBlob('f2'));
  Tree.insertLeafAt(fs, ['dir1', 'dir2', 'file3'], FS.generateFileBlob('f3'));
  Tree.insertLeafAt(fs, ['file4'], FS.generateFileBlob('f4'));
  return fs;
};

test('Get item at path', () => {
  const fs = createSampleFS();

  // Empty path should return root node
  expect(FS.getItemAt(fs, [])).toBe(fs);

  // Regular work day: get file at nested path
  const file1 = FS.getItemAt(fs, ['dir1', 'dir2', 'file3']) as FileBlob;
  expect(file1.contents.contentToken).toBe('f3');
  expect(file1.contents.version).toBe(0);

  // Regular work day: get file under the root
  const file4 = FS.getItemAt(fs, ['file4']) as FileBlob;
  expect(file4.contents.contentToken).toBe('f4');
  expect(file4.contents.version).toBe(0);

  // Regular work day: get directory at nested path
  const dir2 = FS.getItemAt(fs, ['dir1', 'dir2']) as FileSystemInternalNode;
  expect(dir2.has('file3')).toBe(true);

  // Should return `null` if item does not exist
  expect(FS.getItemAt(fs, ['?'])).toBeNull();
  expect(FS.getItemAt(fs, ['dir1', 'dir2', '?'])).toBeNull();
});

test('Create item at path', () => {
  const fs = createSampleFS();

  // Can't create anything *at* the root
  expect(FS.createItemAt(fs, [], 'file')).toBe(false);
  expect(FS.createItemAt(fs, [], 'directory')).toBe(false);

  // Regular work day: create new file under root
  expect(FS.createItemAt(fs, ['file5'], 'file')).toBe(true);
  const file5 = FS.getItemAt(fs, ['file5']) as FileBlob;
  expect(file5).not.toBeNull();
  expect(Tree.isLeafNode(file5)).toBe(true);

  // Regular work day: create directory at some nested path
  expect(FS.createItemAt(fs, ['dir1', 'dir3'], 'directory')).toBe(true);
  const dir3 = FS.getItemAt(fs, ['dir1', 'dir3']) as FileSystemInternalNode;
  expect(dir3).not.toBeNull();
  expect(Tree.isLeafNode(dir3)).toBe(false);
  expect(Array.from(dir3).length).toBe(0);

  // Should fail if path does not exist
  expect(FS.createItemAt(fs, ['dir4', 'foo'], 'file')).toBe(false);
  expect(FS.createItemAt(fs, ['dir4', 'foo'], 'directory')).toBe(false);
  expect(FS.createItemAt(fs, ['dir1', 'dir4', 'foo'], 'file')).toBe(false);
  expect(FS.createItemAt(fs, ['dir4', 'dir4', 'foo'], 'directory')).toBe(false);
});

test('Delete item at path', () => {
  const fs = createSampleFS();

  // Regular work day: delete file under root
  expect(FS.deleteItemAt(fs, ['file4'])).toBe(true);
  expect(FS.getItemAt(fs, ['file4'])).toBeNull();

  // Regular work day: delete directory at nested path
  expect(FS.deleteItemAt(fs, ['dir1', 'dir2'])).toBe(true);
  expect(FS.getItemAt(fs, ['dir1', 'dir2'])).toBeNull();

  // Can't use the FS to destroy the FS
  expect(FS.deleteItemAt(fs, [])).toBe(false);

  // Can't delete items that don't exist
  expect(FS.deleteItemAt(fs, ['foo'])).toBe(false);
  expect(FS.deleteItemAt(fs, ['dir1', 'foo'])).toBe(false);
});

test('Bump file version', () => {
  const fs = createSampleFS();

  // Regular work day: bump version of file under root
  expect(FS.bumpFileVersionAt(fs, ['file4'])).toBe(true);
  const file4 = FS.getItemAt(fs, ['file4']) as FileBlob;
  expect(file4.contents.version).toBe(1);

  // Regular work day: bump version of file at nested path
  expect(FS.bumpFileVersionAt(fs, ['dir1', 'dir2', 'file3'])).toBe(true);
  const file3 = FS.getItemAt(fs, ['dir1', 'dir2', 'file3']) as FileBlob;
  expect(file3.contents.version).toBe(1);

  // Can't bump version of non-existent files
  expect(FS.bumpFileVersionAt(fs, ['?'])).toBe(false);
  // Can't bump version of a directory
  expect(FS.bumpFileVersionAt(fs, ['dir1', 'dir2'])).toBe(false);
});

test('Move an item', () => {
  const fs = createSampleFS();

  // Empty source or destination paths don't make sense
  expect(FS.moveItem(fs, [], [])).toBe(false);
  expect(FS.moveItem(fs, [], [], true)).toBe(false);
  expect(FS.moveItem(fs, [], ['dir1'])).toBe(false);
  expect(FS.moveItem(fs, [], ['dir1'], true)).toBe(false);
  expect(FS.moveItem(fs, ['dir1'], [])).toBe(false);
  expect(FS.moveItem(fs, ['dir1'], [], true)).toBe(false);

  // Can't move items that don't exist
  expect(FS.moveItem(fs, ['dir1', '?'], ['file5'])).toBe(false);
  expect(FS.moveItem(fs, ['dir1', '?'], ['file5'], true)).toBe(false);

  // Can't move to invalid destination
  expect(FS.moveItem(fs, ['file4'], ['dir2', '?'])).toBe(false);
  expect(FS.moveItem(fs, ['file4'], ['dir2', '?'], true)).toBe(false);
  expect(FS.moveItem(fs, ['file4'], ['file4', '?'])).toBe(false);
  expect(FS.moveItem(fs, ['file4'], ['file4', '?'], true)).toBe(false);

  // Regular work day: move file to new location
  expect(FS.moveItem(fs, ['dir1', 'file2'], ['file5'])).toBe(true);
  expect(FS.getItemAt(fs, ['dir1', 'file2'])).toBeNull();
  const newFile = FS.getItemAt(fs, ['file5']) as FileBlob;
  expect(newFile.contents.contentToken).toBe('f2');

  // Regular work day: "copy" directory to new location
  expect(FS.moveItem(fs, ['dir1', 'dir2'], ['dir3'], true)).toBe(true);
  // Check the source directory
  const oldDir = FS.getItemAt(fs, ['dir1', 'dir2']) as FileSystemInternalNode;
  expect(oldDir).not.toBeNull();
  expect(Tree.isLeafNode(oldDir)).toBe(false);
  expect(Array.from(oldDir).length).toBe(1);
  expect((oldDir.get('file3') as FileBlob).contents.contentToken).toBe('f3');
  // Check the destination directory
  const newDir = FS.getItemAt(fs, ['dir3']) as FileSystemInternalNode;
  expect(newDir).not.toBeNull();
  expect(Tree.isLeafNode(newDir)).toBe(false);
  expect(Array.from(newDir).length).toBe(1);
  expect((newDir.get('file3') as FileBlob).contents.contentToken).toBe('f3');
});
