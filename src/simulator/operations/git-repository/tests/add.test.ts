import { createNewSandbox } from '../../..';
import createCommand from '../../file-system/create';
import mkdirCommand from '../../file-system/mkdir';
import rmCommand from '../../file-system/rm';
import gitAddCommand from '../add';

// Stub print function
const p = () => {};

test('git add works', () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['d1', 'd1/d2']).system;
  system = createCommand.execute(system, p, {}, ['d1/f1', 'd1/d2/f2', 'f3'])
    .system;

  // Cannot add directories that don't exist anywhere
  const add404Path = gitAddCommand.execute(system, p, {}, ['???']);
  expect(add404Path.success).toBe(false);
  expect(add404Path.system.repository.indexFile.size()).toBe(0);

  // Add file and directory to index
  const add1 = gitAddCommand.execute(system, p, {}, ['d1', 'f3']);
  expect(add1.success).toBe(true);
  const index1 = add1.system.repository.indexFile;
  expect(index1.get(['f3'])).not.toBeNull();
  expect(index1.get(['d1', 'f1'])).not.toBeNull();
  expect(index1.get(['d1', 'd2', 'f2'])).not.toBeNull();
  expect(index1.get(['d1'])).toBeNull();
  expect(index1.get(['d1', 'd2'])).toBeNull();

  // Delete file and add changes to index
  const rmF1 = rmCommand.execute(add1.system, p, {}, ['d1/f1']);
  const add2 = gitAddCommand.execute(rmF1.system, p, {}, ['d1/f1']);
  expect(add2.success).toBe(true);
  const index2 = add2.system.repository.indexFile;
  expect(index2.get(['d1', 'f1'])).toBeNull();
  expect(index2.get(['d1', 'd2', 'f2'])).not.toBeNull();

  // Replace directory with file
  let sys1 = gitAddCommand.execute(system, p, {}, ['d1', 'f3']).system;
  sys1 = rmCommand.execute(sys1, p, { recursive: true }, ['d1/d2']).system;
  sys1 = createCommand.execute(sys1, p, {}, ['d1/d2']).system;
  sys1 = gitAddCommand.execute(sys1, p, {}, ['d1/d2']).system;
  expect(sys1.repository.indexFile.get(['d1', 'd2'])).not.toBeNull();
  expect(sys1.repository.indexFile.get(['d1', 'd2', 'f2'])).toBeNull();

  // Replace file with directory
  let sys2 = gitAddCommand.execute(system, p, {}, ['d1', 'f3']).system;
  sys2 = rmCommand.execute(sys2, p, {}, ['f1']).system;
  sys2 = mkdirCommand.execute(sys2, p, {}, ['f1']).system;
  sys2 = createCommand.execute(sys2, p, {}, ['f1/f2']).system;
  sys2 = gitAddCommand.execute(sys2, p, {}, ['f1']).system;
  expect(sys2.repository.indexFile.get(['f1', 'f2'])).not.toBeNull();
  expect(sys2.repository.indexFile.get(['f1'])).toBeNull();
});
