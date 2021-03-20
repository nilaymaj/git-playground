import { createNewSandbox } from '../../..';
import FileSystem from '../../../file-system';
import mkdirCommand from '../mkdir';
import createCommand from '../create';

// Stub print function
const p = () => {};

test('mkdir works', () => {
  const system = createNewSandbox();

  // Fail on empty path
  const mkdirEmpty = mkdirCommand.execute(system, p, {}, ['']);
  expect(mkdirEmpty.success).toBe(false);

  // Fail on paths whose parents don't exist
  const mkdirNoParent = mkdirCommand.execute(system, p, {}, ['foo/bar']);
  expect(mkdirNoParent.success).toBe(false);

  // Fail on path that terminates in file node
  const { system: tempSys } = createCommand.execute(system, p, {}, ['foo']);
  const mkdirBadPath1 = mkdirCommand.execute(tempSys, p, {}, ['foo/bar']);
  const mkdirBadPath2 = mkdirCommand.execute(tempSys, p, {}, ['foo/bar/baz']);
  expect(mkdirBadPath1.success).toBe(false);
  expect(mkdirBadPath2.success).toBe(false);

  // Regular working day: make a dir and its subdir successively
  const mkdir1 = mkdirCommand.execute(system, p, {}, ['foo', 'foo/bar']);
  expect(mkdir1.success).toBe(true);
  const newFS1 = mkdir1.system.fileSystem;
  const fooNode1 = newFS1.get(['foo']);
  expect(FileSystem.isDirectory(fooNode1)).toBe(true);
  const fooBarNode = newFS1.get(['foo', 'bar']);
  expect(FileSystem.isDirectory(fooBarNode)).toBe(true);

  // Regular working day: half-completed command works
  const mkdir2 = mkdirCommand.execute(system, p, {}, ['foo', 'bar/baz']);
  expect(mkdir2.success).toBe(false);
  const newFS2 = mkdir2.system.fileSystem;
  const fooNode2 = newFS2.get(['foo']);
  expect(FileSystem.isDirectory(fooNode2)).toBe(true);
});
