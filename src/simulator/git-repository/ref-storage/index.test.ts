import { OrderedMap } from 'immutable';
import * as Ref from './index';
import * as Types from './types';

/**
 * Utility function: creates a sample ref storage for testing
 */
const createSampleRefStorage = (): Types.GitRefStorage => {
  const feature = OrderedMap([
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ]);
  const branchHeads = OrderedMap<Types.RefName, Types.RefTreeNode>([
    ['master', 'addr_master'],
    ['feature', feature],
  ]);
  return { branchHeads };
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

  expect(Ref.createRefAt(storage, [], 'addr')).toBe(null);
  expect(Ref.createRefAt(storage, ['master'], 'addr')).toBe(null);
  expect(Ref.createRefAt(storage, ['feature', 'f1'], 'addr')).toBe(null);

  const newRefStorage1 = Ref.createRefAt(
    storage,
    ['feature', 'f3'],
    'addr_f3'
  ) as Types.GitRefStorage;
  expect(newRefStorage1).not.toBeNull();
  expect(Ref.readRefAt(newRefStorage1, ['feature', 'f3'])).toBe('addr_f3');

  const newRefStorage2 = Ref.createRefAt(
    storage,
    ['bug'],
    'addr'
  ) as Types.GitRefStorage;
  expect(newRefStorage2).not.toBeNull();
  expect(Ref.readRefAt(newRefStorage2, ['bug'])).toBe('addr');
});

test('Can delete refs', () => {
  const storage = createSampleRefStorage();

  expect(Ref.deleteRefAt(storage, ['?'])).toBe(null);
  expect(Ref.deleteRefAt(storage, ['feature'])).toBe(null);
  expect(Ref.deleteRefAt(storage, [])).toBe(null);

  const newStorage = Ref.deleteRefAt(storage, [
    'feature',
    'f2',
  ]) as Types.GitRefStorage;
  expect(newStorage).not.toBeNull();
  expect(Ref.readRefAt(newStorage, ['feature', 'f2'])).toBeNull();
  expect(Ref.readRefAt(newStorage, ['feature', 'f1'])).not.toBeNull();
});

test('Can read children of ref folder', () => {
  const storage = createSampleRefStorage();

  expect(Ref.getRefContentsAt(storage, ['?'])).toBeNull();
  expect(Ref.getRefContentsAt(storage, ['feature', 'f1'])).toBeNull();
  expect(Ref.getRefContentsAt(storage, ['feature', 'f3'])).toBeNull();

  const featureChildren = [
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ];
  const rootChildren = [
    ['master', 'addr_master'],
    ['feature', storage.branchHeads.get('feature')],
  ];
  expect(Ref.getRefContentsAt(storage, ['feature'])).toStrictEqual(
    featureChildren
  );
  expect(Ref.getRefContentsAt(storage, [])).toStrictEqual(rootChildren);
});

test('Can update commit hash at ref', () => {
  const storage = createSampleRefStorage();

  expect(Ref.updateRefAt(storage, [], '?')).toBe(null);
  expect(Ref.updateRefAt(storage, ['feature'], '?')).toBe(null);
  expect(Ref.updateRefAt(storage, ['?'], '?')).toBe(null);

  const newStorage1 = Ref.updateRefAt(
    storage,
    ['master'],
    'new_addr'
  ) as Types.GitRefStorage;
  expect(newStorage1).not.toBeNull();
  expect(Ref.readRefAt(newStorage1, ['master'])).toBe('new_addr');

  const newStorage2 = Ref.updateRefAt(
    storage,
    ['feature', 'f1'],
    'new_addr'
  ) as Types.GitRefStorage;
  expect(newStorage2).not.toBeNull();
  expect(Ref.readRefAt(newStorage2, ['feature', 'f1'])).toBe('new_addr');
});
