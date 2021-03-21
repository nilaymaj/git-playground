import mkdirCommand from '../mkdir';
import createCommand from '../create';
import editCommand from '../edit';
import { createNewSandbox } from '../../..';
import { FileBlob } from '../../../file-system';

// Stub print function
const p = () => {};

test('edit command works', () => {
  let system = createNewSandbox();

  // Prepare the system
  system = mkdirCommand.execute(system, p, {}, ['dir1']).system;
  system = createCommand.execute(system, p, {}, ['dir1/foo', 'bar']).system;
  const baseVersion = (system.fileSystem.get(['bar']) as FileBlob).version;

  // Fail on empty path
  const editRoot = editCommand.execute(system, p, {}, ['']);
  expect(editRoot.success).toBe(false);

  // Fail on path that does not exist
  const edit404Path = editCommand.execute(system, p, {}, ['baz']);
  expect(edit404Path.success).toBe(false);

  // Fail on path terminating at directory
  const editDir = editCommand.execute(system, p, {}, ['dir1']);
  expect(editDir.success).toBe(false);

  // Regular working day: bumps version of file
  const edit1 = editCommand.execute(system, p, {}, ['dir1/foo']);
  expect(edit1.success).toBe(true);
  const fooNode = edit1.system.fileSystem.get(['dir1', 'foo']) as FileBlob;
  expect(fooNode.version).toBe(baseVersion + 1);

  // Regular working day: half-successful command works
  const edit2 = editCommand.execute(system, p, {}, ['bar', '?']);
  expect(edit2.success).toBe(false);
  const barNode = edit2.system.fileSystem.get(['bar']) as FileBlob;
  expect(barNode.version).toBe(baseVersion + 1);
});
