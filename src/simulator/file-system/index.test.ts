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
  // Generate the file blobs
  const files = ['f1', 'f2', 'f3', 'f4'].map(FS.generateFileBlob);

  // Add files and directories to the file system
  let fs = FS.createFileSystem();
  fs = Tree.insertNodeAt(fs, ['dir1']) as FileSystem;
  fs = Tree.insertNodeAt(fs, ['dir1', 'file1'], files[0]) as FileSystem;
  fs = Tree.insertNodeAt(fs, ['dir1', 'file2'], files[1]) as FileSystem;
  fs = Tree.insertNodeAt(fs, ['dir1', 'dir2']) as FileSystem;
  fs = Tree.insertNodeAt(fs, ['dir1', 'dir2', 'file3'], files[2]) as FileSystem;
  fs = Tree.insertNodeAt(fs, ['file4'], files[3]) as FileSystem;
  return fs;
};

test('Get item at path', () => {
  const fs = createSampleFS();

  // Empty path should return root node
  expect(FS.getItemAt(fs, [])).toBe(fs);

  // Regular work day: get file at nested path
  const file1 = FS.getItemAt(fs, ['dir1', 'dir2', 'file3']) as FileBlob;
  expect(file1.contentToken).toBe('f3');
  expect(file1.version).toBe(0);

  // Regular work day: get file under the root
  const file4 = FS.getItemAt(fs, ['file4']) as FileBlob;
  expect(file4.contentToken).toBe('f4');
  expect(file4.version).toBe(0);

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
  expect(FS.createItemAt(fs, [], 'file')).toBe(null);
  expect(FS.createItemAt(fs, [], 'directory')).toBe(null);

  // Regular work day: create new file under root
  const newFS1 = FS.createItemAt(fs, ['file5'], 'file') as FileSystem;
  expect(newFS1).not.toBeNull();
  const file5 = FS.getItemAt(newFS1, ['file5']) as FileBlob;
  expect(file5).not.toBeNull();
  expect(Tree.isLeafNode(file5)).toBe(true);

  // Regular work day: create directory at some nested path
  const newFS2 = FS.createItemAt(
    fs,
    ['dir1', 'dir3'],
    'directory'
  ) as FileSystem;
  expect(newFS2).not.toBeNull();
  const dir3 = FS.getItemAt(newFS2, ['dir1', 'dir3']) as FileSystemInternalNode;
  expect(dir3).not.toBeNull();
  expect(Tree.isLeafNode(dir3)).toBe(false);
  expect(dir3.size).toBe(0);

  // Should fail if path does not exist
  expect(FS.createItemAt(fs, ['dir4', 'foo'], 'file')).toBe(null);
  expect(FS.createItemAt(fs, ['dir4', 'foo'], 'directory')).toBe(null);
  expect(FS.createItemAt(fs, ['dir1', 'dir4', 'foo'], 'file')).toBe(null);
  expect(FS.createItemAt(fs, ['dir4', 'dir4', 'foo'], 'directory')).toBe(null);
});

test('Delete item at path', () => {
  const fs = createSampleFS();

  // Regular work day: delete file under root
  const newFS1 = FS.deleteItemAt(fs, ['file4']) as FileSystem;
  expect(newFS1).not.toBeNull();
  expect(FS.getItemAt(newFS1, ['file4'])).toBeNull();

  // Regular work day: delete directory at nested path
  const newFS2 = FS.deleteItemAt(fs, ['dir1', 'dir2']) as FileSystem;
  expect(newFS2).not.toBeNull();
  expect(FS.getItemAt(newFS2, ['dir1', 'dir2'])).toBeNull();

  // Can't use the FS to destroy the FS
  expect(FS.deleteItemAt(fs, [])).toBe(null);

  // Can't delete items that don't exist
  expect(FS.deleteItemAt(fs, ['foo'])).toBe(null);
  expect(FS.deleteItemAt(fs, ['dir1', 'foo'])).toBe(null);
});

test('Bump file version', () => {
  const fs = createSampleFS();

  // Regular work day: bump version of file under root
  const newFS1 = FS.bumpFileVersionAt(fs, ['file4']) as FileSystem;
  expect(newFS1).not.toBeNull();
  const file4 = FS.getItemAt(newFS1, ['file4']) as FileBlob;
  expect(file4).not.toBeNull();
  expect(file4.version).toBe(1);

  // Regular work day: bump version of file at nested path
  const newFS2 = FS.bumpFileVersionAt(fs, [
    'dir1',
    'dir2',
    'file3',
  ]) as FileSystem;
  expect(newFS2).not.toBeNull();
  const file3 = FS.getItemAt(newFS2, ['dir1', 'dir2', 'file3']) as FileBlob;
  expect(file3.version).toBe(1);

  // Can't bump version of non-existent files
  expect(FS.bumpFileVersionAt(fs, ['?'])).toBe(null);
  // Can't bump version of a directory
  expect(FS.bumpFileVersionAt(fs, ['dir1', 'dir2'])).toBe(null);
});

test('Move an item', () => {
  const fs = createSampleFS();

  // Empty source or destination paths don't make sense
  expect(FS.moveItem(fs, [], [])).toBe(null);
  expect(FS.moveItem(fs, [], [], true)).toBe(null);
  expect(FS.moveItem(fs, [], ['dir1'])).toBe(null);
  expect(FS.moveItem(fs, [], ['dir1'], true)).toBe(null);
  expect(FS.moveItem(fs, ['dir1'], [])).toBe(null);
  expect(FS.moveItem(fs, ['dir1'], [], true)).toBe(null);

  // Can't move items that don't exist
  expect(FS.moveItem(fs, ['dir1', '?'], ['file5'])).toBe(null);
  expect(FS.moveItem(fs, ['dir1', '?'], ['file5'], true)).toBe(null);

  // Can't move to invalid destination
  expect(FS.moveItem(fs, ['file4'], ['dir2', '?'])).toBe(null);
  expect(FS.moveItem(fs, ['file4'], ['dir2', '?'], true)).toBe(null);
  expect(FS.moveItem(fs, ['file4'], ['file4', '?'])).toBe(null);
  expect(FS.moveItem(fs, ['file4'], ['file4', '?'], true)).toBe(null);

  // Regular work day: move file to new location
  const newFS1 = FS.moveItem(fs, ['dir1', 'file2'], ['file5']) as FileSystem;
  expect(newFS1).not.toBeNull();
  expect(FS.getItemAt(newFS1, ['dir1', 'file2'])).toBeNull();
  const newFile = FS.getItemAt(newFS1, ['file5']) as FileBlob;
  expect(newFile.contentToken).toBe('f2');

  // Regular work day: "copy" directory to new location
  const newFS2 = FS.moveItem(
    fs,
    ['dir1', 'dir2'],
    ['dir3'],
    true
  ) as FileSystem;
  expect(newFS2).not.toBeNull();
  // Check the source directory
  const oldDir = FS.getItemAt(newFS1, [
    'dir1',
    'dir2',
  ]) as FileSystemInternalNode;
  expect(oldDir).not.toBeNull();
  expect(Tree.isLeafNode(oldDir)).toBe(false);
  expect(oldDir.size).toBe(1);
  expect((oldDir.get('file3') as FileBlob).contentToken).toBe('f3');
  // Check the destination directory
  const newDir = FS.getItemAt(newFS2, ['dir3']) as FileSystemInternalNode;
  expect(newDir).not.toBeNull();
  expect(Tree.isLeafNode(newDir)).toBe(false);
  expect(newDir.size).toBe(1);
  expect((newDir.get('file3') as FileBlob).contentToken).toBe('f3');
});
