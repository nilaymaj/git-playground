import { createNewSandbox } from '../../..';
import mkdirCommand from '../mkdir';
import createCommand from '../create';

// Stub print function
const p = () => {};

test('create works', () => {
  const system = createNewSandbox();

  // Fail on empty path
  const createEmpty = createCommand.execute(system, p, {}, ['']);
  expect(createEmpty.success).toBe(false);

  // Fail on paths whose parents don't exist
  const createBadPath = createCommand.execute(system, p, {}, ['foo/bar']);
  expect(createBadPath.success).toBe(false);

  // Fail on path that terminates at directory
  const { system: tempSys1 } = mkdirCommand.execute(system, p, {}, ['foo']);
  const createAtDir1 = createCommand.execute(tempSys1, p, {}, ['foo']);
  expect(createAtDir1.success).toBe(false);

  // Regular working day: create file at root and at nested dir
  const { system: tempSys2 } = mkdirCommand.execute(system, p, {}, ['dir']);
  const create1 = createCommand.execute(tempSys2, p, {}, ['foo', 'dir/bar']);
  expect(create1.success).toBe(true);
  expect(create1.system.fileSystem.has(['foo'], 'file')).toBe(true);
  expect(create1.system.fileSystem.has(['dir', 'bar'], 'file')).toBe(true);

  // Regular working day: half-completed command works
  const create2 = createCommand.execute(system, p, {}, ['foo', 'bar/baz']);
  expect(create2.success).toBe(false);
  expect(create2.system.fileSystem.has(['foo'], 'file')).toBe(true);

  // Fail on path that terminates at pre-existing file
  const { system: sysWithFile } = createCommand.execute(system, p, {}, ['foo']);
  const createAtFile = createCommand.execute(sysWithFile, p, {}, ['foo']);
  expect(createAtFile.success).toBe(false);
});
