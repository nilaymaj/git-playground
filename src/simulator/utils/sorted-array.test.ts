import * as SortedArray from './sorted-array';

type NumberArray = SortedArray.SortedArray<number, string>;

const compareNumbers = (a: number, b: number) => {
  if (a === b) return 0;
  else if (a < b) return -1;
  else return 1;
};

const unsortedSampleData = [
  { key: 1, value: 'One' },
  { key: 3, value: 'Three' },
  { key: 2, value: 'Two' },
];
const sortedSampleData = [
  { key: 1, value: 'One' },
  { key: 2, value: 'Two' },
  { key: 3, value: 'Three' },
];

/**
 * Create a sample sorted array as follows:
 * ```
 * [
 *   { key: 1, value: 'One' },
 *   { key: 2, value: 'Two' },
 *   { key: 3, value: 'Three' },
 * ]
 * ```
 */
const createSampleArray = (): NumberArray =>
  SortedArray.create(compareNumbers, [...sortedSampleData]);

test('New array is created correctly', () => {
  const array1 = SortedArray.create<number, string>(compareNumbers);
  expect(array1.items).toStrictEqual([]);
  expect(array1.compareFn(0, 1)).toBeLessThan(0);
  expect(array1.compareFn(1, 0)).toBeGreaterThan(0);
  expect(array1.compareFn(1, 1)).toBe(0);

  const array2 = SortedArray.create<number, string>(compareNumbers, []);
  expect(array2.items).toStrictEqual([]);

  const array3 = SortedArray.create<number, string>(
    compareNumbers,
    unsortedSampleData
  );
  expect(array3.items).toStrictEqual(sortedSampleData);

  // Duplicate-key entries are not allowed:
  const badData = [...unsortedSampleData, { key: 1, value: '?' }];
  expect(() => SortedArray.create(compareNumbers, badData)).toThrow();
});

test('Get item by key', () => {
  const array = createSampleArray();

  // Return item and its index in the array
  const resultFor1 = SortedArray.getByKey(array, 1);
  expect(resultFor1.item).toStrictEqual({ key: 1, value: 'One' });
  expect(resultFor1.index).toBe(0);

  const resultFor2 = SortedArray.getByKey(array, 2);
  expect(resultFor2.item).toStrictEqual({ key: 2, value: 'Two' });
  expect(resultFor2.index).toBe(1);

  // Should return expected index for non-existing items
  const resultFor0 = SortedArray.getByKey(array, 0);
  expect(resultFor0.item).toBeNull();
  expect(resultFor0.index).toBe(0);

  const resultFor2h = SortedArray.getByKey(array, 2.5);
  expect(resultFor2h.item).toBeNull();
  expect(resultFor2h.index).toBe(2);

  const resultFor5 = SortedArray.getByKey(array, 5);
  expect(resultFor5.item).toBeNull();
  expect(resultFor5.index).toBe(3);
});

test('Insert new item', () => {
  const array = createSampleArray();

  // Inserting a new item
  expect(SortedArray.insert(array, { key: 2.5, value: '?' })).toBe(true);
  expect(SortedArray.getByKey(array, 2.5).index).toBe(2);
  expect(SortedArray.getByKey(array, 2.5).item).toStrictEqual({
    key: 2.5,
    value: '?',
  });

  // `upsert` shouldn't matter when inserting a new item
  expect(SortedArray.insert(array, { key: 3.5, value: '??' })).toBe(true);
  expect(SortedArray.getByKey(array, 3.5).index).toBe(4);
  expect(SortedArray.getByKey(array, 3.5).item).toStrictEqual({
    key: 3.5,
    value: '??',
  });

  // Trying to insert an item that already exists won't work...
  expect(SortedArray.insert(array, { key: 2, value: '?' })).toBe(false);
  // ...unless you pass the `upsert` flag, which will update the value.
  expect(SortedArray.insert(array, { key: 2, value: '?' }, true)).toBe(true);
  expect(SortedArray.getByKey(array, 2).index).toBe(1);
  expect(SortedArray.getByKey(array, 2).item).toStrictEqual({
    key: 2,
    value: '?',
  });
});

test('Update an existing item', () => {
  const array = createSampleArray();

  // Updating an existing item
  expect(SortedArray.update(array, 2, 'foo')).toBe(true);
  expect(SortedArray.getByKey(array, 2).index).toBe(1);
  expect(SortedArray.getByKey(array, 2).item).toStrictEqual({
    key: 2,
    value: 'foo',
  });

  // `upsert` shouldn't matter when updating an existing item
  expect(SortedArray.update(array, 2, 'bar', true)).toBe(true);
  expect(SortedArray.getByKey(array, 2).index).toBe(1);
  expect(SortedArray.getByKey(array, 2).item).toStrictEqual({
    key: 2,
    value: 'bar',
  });

  // Trying to update an item that doesn't exist won't work...
  expect(SortedArray.update(array, 2.5, 'baz')).toBe(false);
  // ...unless you pass the `upsert` flag, which will insert new item.
  expect(SortedArray.update(array, 2.5, 'baz', true)).toBe(true);
  expect(SortedArray.getByKey(array, 2.5).index).toBe(2);
  expect(SortedArray.getByKey(array, 2.5).item).toStrictEqual({
    key: 2.5,
    value: 'baz',
  });
});

test('Delete an item', () => {
  const array = createSampleArray();

  expect(SortedArray.deleteItem(array, 1)).toBe(true);
  expect(SortedArray.getByKey(array, 1).item).toBeNull();
  expect(SortedArray.getByKey(array, 2).index).toBe(0);

  // Cannot delete items that don't exist
  expect(SortedArray.deleteItem(array, 2.5)).toBe(false);
});