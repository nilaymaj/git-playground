import mkdirCommand from '../mkdir';
import createCommand from '../create';
import cpCommand from '../cp';
import { createNewSandbox } from '../../..';

// Stub print function
const p = () => {};

test('single-source cp', () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['dir1', 'dir1/dir2']).system;
  system = createCommand.execute(system, p, {}, ['dir1/foo', 'bar']).system;

  // Fail if empty path is provided
  const cpRoot = cpCommand.execute(system, p, {}, ['', 'dir1']);
  expect(cpRoot.success).toBe(false);

  // Fail if path does not exist
  const cp404Path = cpCommand.execute(system, p, {}, ['foo', 'dir1']);
  expect(cp404Path.success).toBe(false);

  // Can't copy directory without recursive flag
  const cpDirNoR = cpCommand.execute(system, p, {}, ['dir1/dir2', '']);
  expect(cpDirNoR.success).toBe(false);

  // Can't copy directory to its subdirectory
  const cpToSubdir = cpCommand.execute(system, p, {}, ['dir1', 'dir1/dir2']);
  expect(cpToSubdir.success).toBe(false);

  // Regular working day: copy file to inside provided directory
  const cpToUnder1 = cpCommand.execute(system, p, {}, ['bar', 'dir1']);
  expect(cpToUnder1.success).toBe(true);
  expect(cpToUnder1.system.fileSystem.has(['bar'])).toBe(true);
  expect(cpToUnder1.system.fileSystem.has(['dir1', 'bar'], 'file')).toBe(true);

  // Regular working day: recursive flag does not matter for file copy
  const cpToUnder2 = cpCommand.execute(system, p, { recursive: true }, [
    'bar',
    'dir1',
  ]);
  expect(cpToUnder2.success).toBe(true);
  expect(cpToUnder2.system.fileSystem.has(['bar'])).toBe(true);
  expect(cpToUnder2.system.fileSystem.has(['dir1', 'bar'], 'file')).toBe(true);

  // Regular working day: copy directory to inside another directory
  const cpToUnder3 = cpCommand.execute(system, p, { recursive: true }, [
    'dir1/dir2',
    '',
  ]);
  expect(cpToUnder3.success).toBe(true);
  expect(cpToUnder3.system.fileSystem.has(['dir1', 'dir2'])).toBe(true);
  expect(cpToUnder3.system.fileSystem.has(['dir2'], 'directory')).toBe(true);
});

test('multi-source cp', () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['dir1', 'dir2', 'dir3']).system;
  system = createCommand.execute(system, p, {}, ['dir1/foo', 'bar', 'baz'])
    .system;

  // Destination must be directory
  const cpNoDir = cpCommand.execute(system, p, {}, ['dir1/foo', 'bar', 'baz']);
  expect(cpNoDir.success).toBe(false);

  // Regular working day: copy files to under directory
  const cpFiles = cpCommand.execute(system, p, {}, ['bar', 'baz', 'dir1']);
  expect(cpFiles.success).toBe(true);
  expect(cpFiles.system.fileSystem.has(['bar'])).toBe(true);
  expect(cpFiles.system.fileSystem.has(['baz'])).toBe(true);
  expect(cpFiles.system.fileSystem.has(['dir1', 'bar'], 'file')).toBe(true);
  expect(cpFiles.system.fileSystem.has(['dir1', 'baz'], 'file')).toBe(true);

  // Can't copy directories without recursive flag
  const cpDirsBad = cpCommand.execute(system, p, {}, ['dir1', 'dir2', 'dir3']);
  expect(cpDirsBad.success).toBe(false);
  expect(cpDirsBad.system.fileSystem.has(['dir3', 'dir1'])).toBe(false);

  // Regular working day: copy directories to under directory
  const cpDirs = cpCommand.execute(system, p, { recursive: true }, [
    'dir1',
    'dir2',
    'dir3',
  ]);
  expect(cpDirs.success).toBe(true);
  expect(cpDirs.system.fileSystem.has(['dir1'])).toBe(true);
  expect(cpDirs.system.fileSystem.has(['dir2'])).toBe(true);
  expect(cpDirs.system.fileSystem.has(['dir3', 'dir1'], 'directory')).toBe(
    true
  );
  expect(cpDirs.system.fileSystem.has(['dir3', 'dir2'], 'directory')).toBe(
    true
  );
});
