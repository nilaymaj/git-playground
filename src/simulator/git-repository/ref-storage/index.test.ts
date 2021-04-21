import { OrderedMap } from 'immutable';
import { InvalidArgError } from '../../utils/errors';
import RefStorage, { RefName, RefTreeNode } from './index';

/**
 * Utility function: creates a sample ref storage for testing
 */
const createSampleRefStorage = (): RefStorage => {
  const feature = OrderedMap([
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ]);
  const branchHeads = OrderedMap<RefName, RefTreeNode>([
    ['master', 'addr_master'],
    ['feature', feature],
  ]);
  return new RefStorage(branchHeads);
};

test('Classifies leaf from node', () => {
  expect(RefStorage.isLeaf('xyz')).toBe(true);
  expect(RefStorage.isLeaf('')).toBe(true);

  const sampleRefStorage = createSampleRefStorage();
  const sampleNode1 = sampleRefStorage.get([]);
  expect(RefStorage.isLeaf(sampleNode1)).toBe(false);
  const sampleNode2 = sampleRefStorage.get(['feature']);
  expect(RefStorage.isLeaf(sampleNode2)).toBe(false);
});

test('Initial ref storage is correct', () => {
  const storage = new RefStorage();
  const master = storage.readLeaf(['master']);
  expect(master).toBe('');
});

test('Can read refs', () => {
  const storage = createSampleRefStorage();

  expect(storage.readLeaf(['master'])).toBe('addr_master');
  expect(storage.readLeaf(['feature', 'f1'])).toBe('addr_f1');

  expect(() => storage.readLeaf(['feature', 'f?'])).toThrowError(
    InvalidArgError
  );
  expect(() => storage.readLeaf(['feature'])).toThrowError(InvalidArgError);
  expect(() => storage.readLeaf([])).toThrowError(InvalidArgError);
});

test('Can create refs', () => {
  const storage = createSampleRefStorage();

  // Can't create refs at invalid paths
  expect(() => storage.create([], 'addr')).toThrowError(InvalidArgError);
  expect(() => storage.create(['master'], 'addr')).toThrowError(
    InvalidArgError
  );
  // Can't create refs that already exist
  expect(() => storage.create(['feature', 'f1'], 'addr')).toThrowError(
    InvalidArgError
  );

  // Regular work day: create direct (unnested) ref
  const newRefStorage2 = storage.create(['bug'], 'addr');
  expect(newRefStorage2.readLeaf(['bug'])).toBe('addr');

  // Regular work day: create ref at nested path
  const newRefStorage1 = storage.create(['feature', 'f3'], 'addr_f3');
  expect(newRefStorage1.readLeaf(['feature', 'f3'])).toBe('addr_f3');
});

test('Can delete refs', () => {
  const storage = createSampleRefStorage();

  // Can't delete non-existent and non-leaf refs
  expect(() => storage.delete(['?'])).toThrowError(InvalidArgError);
  expect(() => storage.delete(['feature'])).toThrowError(InvalidArgError);
  expect(() => storage.delete([])).toThrowError(InvalidArgError);

  const newStorage = storage.delete(['feature', 'f2']);
  expect(newStorage.get(['feature', 'f2'])).toBeNull();
  expect(newStorage.get(['feature', 'f1'])).not.toBeNull();
});

test('Can read children of ref folder', () => {
  const storage = createSampleRefStorage();

  // Can't read contents of non-existent or leaf refs
  expect(() => storage.getChildren(['?'])).toThrowError(InvalidArgError);
  expect(() => storage.getChildren(['feature', 'f1'])).toThrowError(
    InvalidArgError
  );
  expect(() => storage.getChildren(['feature', 'f3'])).toThrowError(
    InvalidArgError
  );

  const featureChildren = [
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ];
  const rootChildren = [
    ['master', 'addr_master'],
    ['feature', storage._branchHeads.get(['feature'])],
  ];
  expect(storage.getChildren(['feature'])).toStrictEqual(featureChildren);
  expect(storage.getChildren([])).toStrictEqual(rootChildren);
});

test('Can update commit hash at ref', () => {
  const storage = createSampleRefStorage();

  expect(() => storage.update([], '?')).toThrowError(InvalidArgError);
  expect(() => storage.update(['feature'], '?')).toThrowError(InvalidArgError);
  expect(() => storage.update(['?'], '?')).toThrowError(InvalidArgError);

  const newStorage1 = storage.update(['master'], 'new_addr');
  expect(newStorage1.readLeaf(['master'])).toBe('new_addr');

  const newStorage2 = storage.update(['feature', 'f1'], 'new_addr');
  expect(newStorage2.readLeaf(['feature', 'f1'])).toBe('new_addr');
});
