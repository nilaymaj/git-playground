/**
 * A single item in the sorted array.
 */
export type SortedArrayItem<K, V> = { key: K; value: V };

/**
 * Type for a function that compares two keys and returns:
 * - `positive num`: if first element is larger,
 * - `negative num`: if second element is larger,
 * - `zero`: if the elements are equal.
 */
type CompareFunction<K> = (a: K, b: K) => number;

/**
 * A simple implementation of a sorted array data structure, that
 * allows you to store items sortable by key. `K`: item key, `V`: item value
 *
 * Multiple items with identical keys are not allowed.
 *
 * - Get item by key: `O(log n)`
 * - Update item value: `O(log n)`
 * - Insert item: `O(n)`
 * - Delete item: `O(n)`
 */
export type SortedArray<K, V> = {
  items: SortedArrayItem<K, V>[];
  compareFn: CompareFunction<K>;
};

/**
 * Creates a new SortedArray with the given compare function, and
 * optionally preloaded with given items.
 *
 * Pass `isSorted: true` if items provided are pre-sorted.
 *
 * If `isSorted: false`, throws if duplicate-key items are found.
 */
export const create = <K, V>(
  compareFn: CompareFunction<K>,
  items: { key: K; value: V }[] = [],
  isSorted?: boolean
): SortedArray<K, V> => {
  if (items.length === 0) return { items: [], compareFn };
  return {
    items: isSorted
      ? items
      : items.sort((a, b) => {
          const result = compareFn(a.key, b.key);
          if (result === 0) throw new Error('Items with same key not allowed');
          return result;
        }),
    compareFn,
  };
};

/**
 * Runs a binary search in the sorted array to find an item by its key.
 * - If item is found, returns the item and its index in the array.
 * - If not found, returns `null` item and the index at which item should be inserted.
 */
export const getByKey = <K, V>(
  array: SortedArray<K, V>,
  key: K
): { item: SortedArrayItem<K, V> | null; index: number } => {
  let lowIndex = 0;
  let highIndex = array.items.length - 1;

  // Run binary search on the array
  while (lowIndex <= highIndex) {
    const midIndex = Math.floor((lowIndex + highIndex) / 2);
    const item = array.items[midIndex];
    const compared = array.compareFn(item.key, key);

    if (compared === 0) return { item, index: midIndex };
    else if (compared < 0) lowIndex = midIndex + 1;
    else if (compared > 0) highIndex = midIndex - 1;
  }

  // Hasn't returned yet? Item does not exist
  if (lowIndex - highIndex !== 1) throw new Error(`Wait - that's illegal.`);
  return { item: null, index: lowIndex };
};

/**
 * Inserts a new item into the sorted array at appropriate index.
 * If `upsert` is `true`, updates value if item with key exists.
 * Else, returns `false` if item with same key already exists.
 */
export const insert = <K, V>(
  array: SortedArray<K, V>,
  itemToInsert: SortedArrayItem<K, V>,
  upsert?: boolean
): boolean => {
  const { item, index } = getByKey(array, itemToInsert.key);
  if (item && !upsert) return false;
  else if (item) array.items[index] = itemToInsert;
  else array.items.splice(index, 0, itemToInsert);
  return true;
};

/**
 * Updates the value of an existing item in sorted array.
 * If `upsert` is `true`, inserts item if it does not exist.
 * Else, returns `false` if item does not exist.
 */
export const update = <K, V>(
  array: SortedArray<K, V>,
  itemKey: K,
  newValue: V,
  upsert?: boolean
): boolean => {
  const { item, index } = getByKey(array, itemKey);
  if (!item && !upsert) return false;
  else if (!item) {
    const newItem = { key: itemKey, value: newValue };
    array.items.splice(index, 0, newItem);
  } else array.items[index].value = newValue;
  return true;
};

/**
 * Deletes item with given key in sorted array.
 * Returns `false`, if item does not exist.
 */
export const deleteItem = <K, V>(
  array: SortedArray<K, V>,
  itemKey: K
): boolean => {
  const { item, index } = getByKey(array, itemKey);
  if (!item) return false;
  array.items.splice(index, 1);
  return true;
};
