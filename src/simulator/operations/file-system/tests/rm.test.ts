import mkdirCommand from '../mkdir';
import createCommand from '../create';
import { createNewSandbox } from '../../..';
import rmCommand from '../rm';

// Stub print function
const p = () => {};

test('edit command works', () => {
  let system = createNewSandbox();

  // Prepare the system
  system = mkdirCommand.execute(system, p, {}, ['dir1']).system;
  system = createCommand.execute(system, p, {}, ['dir1/foo', 'bar']).system;

  // Fail if root path is provided
  const rmRoot = rmCommand.execute(system, p, {}, ['']);
  expect(rmRoot.success).toBe(false);
  expect(rmRoot.system.fileSystem.has([])).toBe(true);

  // Fail if path does not exist
  const rm404Path = rmCommand.execute(system, p, {}, ['??']);
  expect(rm404Path.success).toBe(false);

  // Directories can be deleted only with `recursive` flag
  const rmDirBad = rmCommand.execute(system, p, {}, ['dir1']);
  expect(rmDirBad.success).toBe(false);
  expect(rmDirBad.system.fileSystem.has(['dir1'], 'directory')).toBe(true);

  const rmDirGood = rmCommand.execute(system, p, { recursive: true }, ['dir1']);
  expect(rmDirGood.success).toBe(true);
  expect(rmDirGood.system.fileSystem.has(['dir1'])).toBe(false);

  // Files can be deleted with or without `recursive` flag
  const rmFile1 = rmCommand.execute(system, p, {}, ['bar']);
  expect(rmFile1.success).toBe(true);
  expect(rmFile1.system.fileSystem.has(['bar'])).toBe(false);

  const rmFile2 = rmCommand.execute(system, p, { recursive: true }, ['bar']);
  expect(rmFile2.success).toBe(true);
  expect(rmFile2.system.fileSystem.has(['bar'])).toBe(false);
});
