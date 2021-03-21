import FileSystem, { FileBlob, FileSystemInternalNode } from './index';
import { InvalidArgError } from '../utils/errors';

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
  const files = ['f1', 'f2', 'f3', 'f4'].map(FileSystem.generateFileBlob);

  // Add files and directories to the file system
  let fs = new FileSystem()._fs;
  fs = fs.insert(['dir1']);
  fs = fs.insert(['dir1', 'file1'], files[0]);
  fs = fs.insert(['dir1', 'file2'], files[1]);
  fs = fs.insert(['dir1', 'dir2']);
  fs = fs.insert(['dir1', 'dir2', 'file3'], files[2]);
  fs = fs.insert(['file4'], files[3]);
  return new FileSystem(fs);
};

test('Get item at path', () => {
  const fs = createSampleFS();

  // Empty path should return root node
  expect(fs.get([])).toBe(fs._fs._tree);

  // Regular work day: get file at nested path
  const file1 = fs.get(['dir1', 'dir2', 'file3']) as FileBlob;
  expect(file1.contentToken).toBe('f3');
  expect(file1.version).toBe(0);

  // Regular work day: get file under the root
  const file4 = fs.get(['file4']) as FileBlob;
  expect(file4.contentToken).toBe('f4');
  expect(file4.version).toBe(0);

  // Regular work day: get directory at nested path
  const dir2 = fs.get(['dir1', 'dir2']) as FileSystemInternalNode;
  expect(dir2.has('file3')).toBe(true);

  // Should return `null` if item does not exist
  expect(fs.get(['?'])).toBeNull();
  expect(fs.get(['dir1', 'dir2', '?'])).toBeNull();
});

test('Get path depth', () => {
  const fs = createSampleFS();

  expect(fs.getPathDepth([])).toBe(0);

  expect(fs.getPathDepth(['dir1'])).toBe(1);
  expect(fs.getPathDepth(['dir1', 'dir2'])).toBe(1);

  expect(fs.getPathDepth(['dir1', 'dir2', 'file3'])).toBe(2);
  expect(fs.getPathDepth(['dir1', 'file1'])).toBe(2);
  expect(fs.getPathDepth(['dir1', 'file2'])).toBe(2);
  expect(fs.getPathDepth(['file4'])).toBe(2);

  expect(fs.getPathDepth(['foo'])).toBe(3);
  expect(fs.getPathDepth(['dir1', 'foo'])).toBe(3);
  expect(fs.getPathDepth(['dir1', 'dir2', 'foo'])).toBe(3);

  expect(fs.getPathDepth(['file4', 'foo'])).toBe(4);
  expect(fs.getPathDepth(['dir1', 'file1', 'foo'])).toBe(4);

  expect(fs.getPathDepth(['dir3', 'foo'])).toBe(5);
});

test('Create item at path', () => {
  const fs = createSampleFS();

  // Can't create anything *at* the root
  expect(() => fs.create([], 'file')).toThrowError(InvalidArgError);
  expect(() => fs.create([], 'directory')).toThrowError(InvalidArgError);

  // Regular work day: create new file under root
  const newFS1 = fs.create(['file5'], 'file');
  const file5 = newFS1.get(['file5']) as FileBlob;
  expect(file5).not.toBeNull();
  expect(FileSystem.isFile(file5)).toBe(true);

  // Regular work day: create directory at some nested path
  const newFS2 = fs.create(['dir1', 'dir3'], 'directory');
  const dir3 = newFS2.get(['dir1', 'dir3']) as FileSystemInternalNode;
  expect(dir3).not.toBeNull();
  expect(FileSystem.isDirectory(dir3)).toBe(true);
  expect(dir3.size).toBe(0);

  // Should fail if path does not exist
  expect(() => fs.create(['dir4', 'foo'], 'file')).toThrowError(
    InvalidArgError
  );
  expect(() => fs.create(['dir4', 'foo'], 'directory')).toThrowError(
    InvalidArgError
  );
  expect(() => fs.create(['dir1', 'dir4', 'foo'], 'file')).toThrowError(
    InvalidArgError
  );
  expect(() => fs.create(['dir4', 'dir4', 'foo'], 'directory')).toThrowError(
    InvalidArgError
  );
});

test('Delete item at path', () => {
  const fs = createSampleFS();

  // Regular work day: delete file under root
  const newFS1 = fs.delete(['file4']);
  expect(newFS1.get(['file4'])).toBeNull();

  // Regular work day: delete directory at nested path
  const newFS2 = fs.delete(['dir1', 'dir2']);
  expect(newFS2.get(['dir1', 'dir2'])).toBeNull();

  // Can't use the FS to destroy the FS
  expect(() => fs.delete([])).toThrowError(InvalidArgError);

  // Can't delete items that don't exist
  expect(() => fs.delete(['foo'])).toThrowError(InvalidArgError);
  expect(() => fs.delete(['dir1', 'foo'])).toThrowError(InvalidArgError);
});

test('Check if fs has path', () => {
  const fs = createSampleFS();

  expect(fs.has([])).toBe(true);
  expect(fs.has([], 'directory')).toBe(true);
  expect(fs.has([], 'file')).toBe(false);

  expect(fs.has(['dir1'])).toBe(true);
  expect(fs.has(['dir1'], 'directory')).toBe(true);
  expect(fs.has(['dir1'], 'file')).toBe(false);

  expect(fs.has(['dir1', 'file1'])).toBe(true);
  expect(fs.has(['dir1', 'file1'], 'directory')).toBe(false);
  expect(fs.has(['dir1', 'file1'], 'file')).toBe(true);

  expect(fs.has(['dir1', '?'])).toBe(false);
  expect(fs.has(['dir1', '?'], 'directory')).toBe(false);
  expect(fs.has(['dir1', '?'], 'file')).toBe(false);
});

test('Bump file version', () => {
  const fs = createSampleFS();

  // Regular work day: bump version of file under root
  const newFS1 = fs.bumpFileVersion(['file4']);
  const file4 = newFS1.get(['file4']) as FileBlob;
  expect(file4).not.toBeNull();
  expect(file4.version).toBe(1);

  // Regular work day: bump version of file at nested path
  const newFS2 = fs.bumpFileVersion(['dir1', 'dir2', 'file3']);
  const file3 = newFS2.get(['dir1', 'dir2', 'file3']) as FileBlob;
  expect(file3.version).toBe(1);

  // Can't bump version of non-existent files
  expect(() => fs.bumpFileVersion(['?'])).toThrowError(InvalidArgError);
  // Can't bump version of a directory
  expect(() => fs.bumpFileVersion(['dir1', 'dir2'])).toThrowError(
    InvalidArgError
  );
});

test('Move an item', () => {
  const fs = createSampleFS();

  // Empty source or destination paths don't make sense
  expect(() => fs.move([], [])).toThrowError(InvalidArgError);
  expect(() => fs.move([], [], true)).toThrowError(InvalidArgError);
  expect(() => fs.move([], ['dir1'])).toThrowError(InvalidArgError);
  expect(() => fs.move([], ['dir1'], true)).toThrowError(InvalidArgError);
  expect(() => fs.move(['dir1'], [])).toThrowError(InvalidArgError);
  expect(() => fs.move(['dir1'], [], true)).toThrowError(InvalidArgError);

  // Can't move items that don't exist
  expect(() => fs.move(['dir1', '?'], ['file5'])).toThrowError(InvalidArgError);
  expect(() => fs.move(['dir1', '?'], ['file5'], true)).toThrowError(
    InvalidArgError
  );

  // Can't move to invalid destination
  expect(() => fs.move(['file4'], ['dir2', '?'])).toThrowError(InvalidArgError);
  expect(() => fs.move(['file4'], ['dir2', '?'], true)).toThrowError(
    InvalidArgError
  );
  expect(() => fs.move(['file4'], ['file4', '?'])).toThrowError(
    InvalidArgError
  );
  expect(() => fs.move(['file4'], ['file4', '?'], true)).toThrowError(
    InvalidArgError
  );

  // Regular work day: move file to new location
  const newFS1 = fs.move(['dir1', 'file2'], ['file5']);
  expect(newFS1.get(['dir1', 'file2'])).toBeNull();
  const newFile = newFS1.get(['file5']) as FileBlob;
  expect(newFile.contentToken).toBe('f2');

  // Regular work day: "copy" directory to new location
  const newFS2 = fs.move(['dir1', 'dir2'], ['dir3'], true);
  // Check the source directory
  const oldDir = newFS2.get(['dir1', 'dir2']) as FileSystemInternalNode;
  expect(oldDir).not.toBeNull();
  expect(FileSystem.isFile(oldDir)).toBe(false);
  expect(oldDir.size).toBe(1);
  expect((oldDir.get('file3') as FileBlob).contentToken).toBe('f3');
  // Check the destination directory
  const newDir = newFS2.get(['dir3']) as FileSystemInternalNode;
  expect(newDir).not.toBeNull();
  expect(FileSystem.isFile(newDir)).toBe(false);
  expect(newDir.size).toBe(1);
  expect((newDir.get('file3') as FileBlob).contentToken).toBe('f3');
});
