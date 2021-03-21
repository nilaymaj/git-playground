import mkdirCommand from '../mkdir';
import createCommand from '../create';
import mvCommand from '../mv';
import { createNewSandbox } from '../../..';

// Stub print function
const p = () => {};

test('single-source mv', () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['dir1', 'dir1/dir2']).system;
  system = createCommand.execute(system, p, {}, ['dir1/foo', 'bar']).system;

  // Fail if empty path is provided
  const mvRoot = mvCommand.execute(system, p, {}, ['', 'dir1']);
  expect(mvRoot.success).toBe(false);

  // Fail if path does not exist
  const mv404Path = mvCommand.execute(system, p, {}, ['foo', 'dir1']);
  expect(mv404Path.success).toBe(false);

  // Can't move directory without recursive flag
  const mvDirNoR = mvCommand.execute(system, p, {}, ['dir1/dir2', '']);
  expect(mvDirNoR.success).toBe(false);

  // Can't move directory to its subdirectory
  const mvToSubdir = mvCommand.execute(system, p, {}, ['dir1', 'dir1/dir2']);
  expect(mvToSubdir.success).toBe(false);

  // Regular working day: move file to inside provided directory
  const mvToUnder1 = mvCommand.execute(system, p, {}, ['bar', 'dir1']);
  expect(mvToUnder1.success).toBe(true);
  expect(mvToUnder1.system.fileSystem.has(['bar'])).toBe(false);
  expect(mvToUnder1.system.fileSystem.has(['dir1', 'bar'], 'file')).toBe(true);

  // Regular working day: recursive flag does not matter for file move
  const mvToUnder2 = mvCommand.execute(system, p, { recursive: true }, [
    'bar',
    'dir1',
  ]);
  expect(mvToUnder2.success).toBe(true);
  expect(mvToUnder2.system.fileSystem.has(['bar'])).toBe(false);
  expect(mvToUnder2.system.fileSystem.has(['dir1', 'bar'], 'file')).toBe(true);

  // Regular working day: move directory to inside another directory
  const mvToUnder3 = mvCommand.execute(system, p, { recursive: true }, [
    'dir1/dir2',
    '',
  ]);
  expect(mvToUnder3.success).toBe(true);
  expect(mvToUnder3.system.fileSystem.has(['dir1', 'dir2'])).toBe(false);
  expect(mvToUnder3.system.fileSystem.has(['dir2'], 'directory')).toBe(true);
});

test('multi-source mv', () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['dir1', 'dir2', 'dir3']).system;
  system = createCommand.execute(system, p, {}, ['dir1/foo', 'bar', 'baz'])
    .system;

  // Destination must be directory
  const mvNoDir = mvCommand.execute(system, p, {}, ['dir1/foo', 'bar', 'baz']);
  expect(mvNoDir.success).toBe(false);

  // Regular working day: move files to under directory
  const mvFiles = mvCommand.execute(system, p, {}, ['bar', 'baz', 'dir1']);
  expect(mvFiles.success).toBe(true);
  expect(mvFiles.system.fileSystem.has(['bar'])).toBe(false);
  expect(mvFiles.system.fileSystem.has(['baz'])).toBe(false);
  expect(mvFiles.system.fileSystem.has(['dir1', 'bar'], 'file')).toBe(true);
  expect(mvFiles.system.fileSystem.has(['dir1', 'baz'], 'file')).toBe(true);

  // Can't move directories without recursive flag
  const mvDirsBad = mvCommand.execute(system, p, {}, ['dir1', 'dir2', 'dir3']);
  expect(mvDirsBad.success).toBe(false);
  expect(mvDirsBad.system.fileSystem.has(['dir1'], 'directory')).toBe(true);

  // Regular working day: move directories to under directory
  const mvDirs = mvCommand.execute(system, p, { recursive: true }, [
    'dir1',
    'dir2',
    'dir3',
  ]);
  expect(mvDirs.success).toBe(true);
  expect(mvDirs.system.fileSystem.has(['dir1'])).toBe(false);
  expect(mvDirs.system.fileSystem.has(['dir2'])).toBe(false);
  expect(mvDirs.system.fileSystem.has(['dir3', 'dir1'], 'directory')).toBe(
    true
  );
  expect(mvDirs.system.fileSystem.has(['dir3', 'dir2'], 'directory')).toBe(
    true
  );
});
