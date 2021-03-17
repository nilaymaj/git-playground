import { OrderedMap } from 'immutable';
import { InvalidArgError } from '../../utils/errors';
import Tree from '../../utils/tree';
import * as Ref from './index';

/**
 * Utility function: creates a sample ref storage for testing
 */
const createSampleRefStorage = (): Ref.GitRefStorage => {
  const feature = OrderedMap([
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ]);
  const branchHeads = OrderedMap<Ref.RefName, Ref.RefTreeNode>([
    ['master', 'addr_master'],
    ['feature', feature],
  ]);
  return { branchHeads: new Tree(branchHeads) };
};

test('Can read refs', () => {
  const storage = createSampleRefStorage();

  expect(Ref.readRefAt(storage, ['master'])).toBe('addr_master');
  expect(Ref.readRefAt(storage, ['feature', 'f1'])).toBe('addr_f1');

  expect(Ref.readRefAt(storage, ['feature', 'f?'])).toBeNull();
  expect(Ref.readRefAt(storage, ['feature'])).toBeNull();
  expect(Ref.readRefAt(storage, [])).toBeNull();
});

test('Can create refs', () => {
  const storage = createSampleRefStorage();

  // Can't create refs at invalid paths
  expect(() => Ref.createRefAt(storage, [], 'addr')).toThrowError(
    InvalidArgError
  );
  expect(() => Ref.createRefAt(storage, ['master'], 'addr')).toThrowError(
    InvalidArgError
  );
  // Can't create refs that already exist
  expect(() =>
    Ref.createRefAt(storage, ['feature', 'f1'], 'addr')
  ).toThrowError(InvalidArgError);

  // Regular work day: create direct (unnested) ref
  const newRefStorage2 = Ref.createRefAt(storage, ['bug'], 'addr');
  expect(Ref.readRefAt(newRefStorage2, ['bug'])).toBe('addr');

  // Regular work day: create ref at nested path
  const newRefStorage1 = Ref.createRefAt(storage, ['feature', 'f3'], 'addr_f3');
  expect(Ref.readRefAt(newRefStorage1, ['feature', 'f3'])).toBe('addr_f3');
});

test('Can delete refs', () => {
  const storage = createSampleRefStorage();

  // Can't delete non-existent and non-leaf refs
  expect(() => Ref.deleteLeafRef(storage, ['?'])).toThrowError(InvalidArgError);
  expect(() => Ref.deleteLeafRef(storage, ['feature'])).toThrowError(
    InvalidArgError
  );
  expect(() => Ref.deleteLeafRef(storage, [])).toThrowError(InvalidArgError);

  const newStorage = Ref.deleteLeafRef(storage, ['feature', 'f2']);
  expect(Ref.readRefAt(newStorage, ['feature', 'f2'])).toBeNull();
  expect(Ref.readRefAt(newStorage, ['feature', 'f1'])).not.toBeNull();
});

test('Can read children of ref folder', () => {
  const storage = createSampleRefStorage();

  // Can't read contents of non-existent or leaf refs
  expect(() => Ref.getRefContentsAt(storage, ['?'])).toThrowError(
    InvalidArgError
  );
  expect(() => Ref.getRefContentsAt(storage, ['feature', 'f1'])).toThrowError(
    InvalidArgError
  );
  expect(() => Ref.getRefContentsAt(storage, ['feature', 'f3'])).toThrowError(
    InvalidArgError
  );

  const featureChildren = [
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ];
  const rootChildren = [
    ['master', 'addr_master'],
    ['feature', storage.branchHeads.get(['feature'])],
  ];
  expect(Ref.getRefContentsAt(storage, ['feature'])).toStrictEqual(
    featureChildren
  );
  expect(Ref.getRefContentsAt(storage, [])).toStrictEqual(rootChildren);
});

test('Can update commit hash at ref', () => {
  const storage = createSampleRefStorage();

  expect(() => Ref.updateRefAt(storage, [], '?')).toThrowError(InvalidArgError);
  expect(() => Ref.updateRefAt(storage, ['feature'], '?')).toThrowError(
    InvalidArgError
  );
  expect(() => Ref.updateRefAt(storage, ['?'], '?')).toThrowError(
    InvalidArgError
  );

  const newStorage1 = Ref.updateRefAt(storage, ['master'], 'new_addr');
  expect(Ref.readRefAt(newStorage1, ['master'])).toBe('new_addr');

  const newStorage2 = Ref.updateRefAt(storage, ['feature', 'f1'], 'new_addr');
  expect(Ref.readRefAt(newStorage2, ['feature', 'f1'])).toBe('new_addr');
});
