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
