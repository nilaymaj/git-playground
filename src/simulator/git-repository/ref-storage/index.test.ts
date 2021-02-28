import * as Ref from './index';
import * as Types from './types';

/**
 * Utility function: creates a sample ref storage for testing
 */
const createSampleRefStorage = (): Types.GitRefStorage => {
  const feature = new Map([
    ['f1', 'addr_f1'],
    ['f2', 'addr_f2'],
  ]);
  const branchHeads = new Map<Types.RefName, Types.RefTreeNode>([
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

  expect(Ref.createRefAt(storage, [], 'addr')).toBe(false);
  expect(Ref.createRefAt(storage, ['master'], 'addr')).toBe(false);
  expect(Ref.createRefAt(storage, ['feature', 'f1'], 'addr')).toBe(false);

  expect(Ref.createRefAt(storage, ['feature', 'f3'], 'addr_f3')).toBe(true);
  expect(Ref.readRefAt(storage, ['feature', 'f3'])).toBe('addr_f3');
  expect(Ref.createRefAt(storage, ['bug', 'x'], 'addr')).toBe(true);
  expect(Ref.readRefAt(storage, ['bug', 'x'])).toBe('addr');
});

test('Can delete refs', () => {
  const storage = createSampleRefStorage();

  expect(Ref.deleteRefAt(storage, ['?'])).toBe(false);
  expect(Ref.deleteRefAt(storage, ['feature'])).toBe(false);
  expect(Ref.deleteRefAt(storage, [])).toBe(false);

  expect(Ref.deleteRefAt(storage, ['feature', 'f2'])).toBe(true);
  expect(Ref.readRefAt(storage, ['feature', 'f2'])).toBeNull();
  expect(Ref.readRefAt(storage, ['feature', 'f1'])).not.toBeNull();
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

  expect(Ref.updateRefAt(storage, [], '?')).toBe(false);
  expect(Ref.updateRefAt(storage, ['feature'], '?')).toBe(false);
  expect(Ref.updateRefAt(storage, ['?'], '?')).toBe(false);

  expect(Ref.updateRefAt(storage, ['master'], 'new_addr')).toBe(true);
  expect(Ref.readRefAt(storage, ['master'])).toBe('new_addr');
  expect(Ref.updateRefAt(storage, ['feature', 'f1'], 'new_addr')).toBe(true);
  expect(Ref.readRefAt(storage, ['feature', 'f1'])).toBe('new_addr');
});
