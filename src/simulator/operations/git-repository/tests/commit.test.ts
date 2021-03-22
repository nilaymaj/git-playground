import { createNewSandbox } from '../../..';
import {
  GitCommit,
  GitTree,
} from '../../../git-repository/object-storage/types';
import { serializeGitTree } from '../../../git-repository/object-storage/utils';
import Tree from '../../../utils/tree';
import createCommand from '../../file-system/create';
import mkdirCommand from '../../file-system/mkdir';
import { successState } from '../../utils';
import gitAddCommand from '../add';
import gitCommitCommand from '../commit';

// Stub print function
const p = () => {};

test('git commit works', () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['d1', 'd1/d2']).system;
  system = createCommand.execute(system, p, {}, ['d1/f1', 'd1/d2/f2', 'f3'])
    .system;
  system = gitAddCommand.execute(system, p, {}, ['d1']).system;

  // Commit the current index
  const committed = gitCommitCommand.execute(system, p, { message: 'a' }, []);
  expect(committed.success).toBe(true);

  // Check commit object in object storage
  const objStorage = committed.system.repository.objectStorage;
  const commitEntry = objStorage
    .entries()
    .find(({ object }) => object.type === 'commit');
  expect(commitEntry).not.toBeUndefined();
  expect(commitEntry?.object.type).toBe('commit');
  const commitObject = commitEntry?.object as GitCommit;
  expect(commitObject.message).toBe('a');

  // Check that the committed work tree is correct
  const treeRoot = objStorage.read(commitObject.workTree) as GitTree;
  expect(treeRoot.type).toBe('tree');
  const workTree = serializeGitTree(treeRoot, objStorage);
  const f1Node = workTree.get(['d1', 'f1']);
  expect(Tree.isLeafNode(f1Node)).toBe(true);
  const f2Node = workTree.get(['d1', 'd2', 'f2']);
  expect(Tree.isLeafNode(f2Node)).toBe(true);
  expect(workTree.get(['f3'])).toBeNull();

  // Check that the index file is intact
  const oldIndex = system.repository.indexFile;
  const newIndex = committed.system.repository.indexFile;
  expect(newIndex.entries()).toStrictEqual(oldIndex.entries());

  // Check if HEAD is updated
  // @todo do this once ref system is revamped

  // Check that the filesystem hasn't changed
  expect(system.fileSystem).toBe(committed.system.fileSystem);
});

/**
 * As the index file is stored as an array and not a tree, it is
 * possible for the index file to represent an invalid tree:
 * - dir1/file
 * - dir1/file/what
 *
 * While Git tries to prevent such a state as much as possible,
 * it also protects against such states while committing - because
 * however hard you try, such cases can always creep in.
 */
test(`can't commit bad trees`, () => {
  // Prepare the system
  let system = createNewSandbox();
  system = mkdirCommand.execute(system, p, {}, ['d1', 'd1/d2']).system;
  system = createCommand.execute(system, p, {}, ['d1/f1', 'd1/d2/f2', 'f3'])
    .system;
  system = gitAddCommand.execute(system, p, {}, ['d1']).system;

  const sysIndex = system.repository.indexFile;
  const f1Hash = sysIndex.get(['d1', 'f1'])?.objectHash as string;
  expect(f1Hash).toBeTruthy();

  // Create inconsistent index file and try to commit it
  const badIndex = sysIndex.upsert(['d1', 'f1', 'f'], { objectHash: f1Hash });
  const badSys = successState(system, null, null, badIndex).system;
  const badCommit = gitCommitCommand.execute(badSys, p, { message: 'a' }, []);
  expect(badCommit.success).toBe(false);
});
