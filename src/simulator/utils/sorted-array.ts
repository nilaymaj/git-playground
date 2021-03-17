import { List } from 'immutable';
import { Apocalypse, InvalidArgError } from './errors';

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
 * - Find range: `O(l + log n)` (`l`: length of required range)
 */
export default class SortedArray<K, V> {
  _items: List<SortedArrayItem<K, V>>;
  _compareFn: CompareFunction<K>;

  /**
   * Create a new SortedArray initialized with the provided
   * comparator and optionally with the provided data.
   *
   * Pass `isSorted: true` if provided data is already sorted.
   */
  constructor(
    compareFn: CompareFunction<K>,
    items?: SortedArrayItem<K, V>[] | List<SortedArrayItem<K, V>>,
    isSorted: boolean = false
  ) {
    Object.freeze(compareFn); // Just a precaution.
    this._compareFn = compareFn;
    if (!items) this._items = List();
    else {
      let itemsList = List(items);
      if (!isSorted)
        itemsList = itemsList.sort((a, b) => {
          const result = compareFn(a.key, b.key);
          if (result === 0) throw new InvalidArgError('Duplicate-key items');
          return result;
        });
      this._items = itemsList;
    }
  }

  /**
   * Immutability helper method: use this to return
   * SortedArray class with new data.
   *
   * Pass `sort: true` if new data needs to be sorted.
   */
  private updatedClass = (
    newItems: List<SortedArrayItem<K, V>>,
    sort?: boolean
  ) => {
    if (newItems === this._items) return this;
    else return new SortedArray(this._compareFn, newItems, !sort);
  };

  /**
   * Get an element value and index by its key or key-finder.
   * If element does not exist, returns its expected position.
   *
   * @param key Can be the key of element to find, or a key-finder function
   * that acts as comparator for finding element with required key. If key-finder
   * returns 0 for multiple elements, the first found element is returned.
   */
  get = (
    key: K | ((k: K) => number)
  ): { item: SortedArrayItem<K, V> | null; index: number } => {
    let lowIndex = 0;
    let highIndex = this._items.size - 1;

    // Create a compare function that takes care of both `key` types
    const compareFn = (argKey: K) => {
      if (typeof key === 'function') return (key as (k: K) => number)(argKey);
      else return this._compareFn(argKey, key);
    };

    // Run binary search on the array
    while (lowIndex <= highIndex) {
      const midIndex = Math.floor((lowIndex + highIndex) / 2);
      const item = this._items.get(midIndex);
      if (!item) throw new Apocalypse();
      const compared = compareFn(item.key);

      if (compared === 0) return { item, index: midIndex };
      else if (compared < 0) lowIndex = midIndex + 1;
      else if (compared > 0) highIndex = midIndex - 1;
    }

    // Hasn't returned yet? Item does not exist
    if (lowIndex - highIndex !== 1) throw new Apocalypse();
    return { item: null, index: lowIndex };
  };

  /**
   * Return item located at given index in the SortedArray
   * @todo Write tests for this?
   */
  itemAt = (index: number) => this._items.get(index, null);

  /**
   * Return the number of elements in the SortedArray.
   * @todo Write tests for this?
   */
  size = (): number => this._items.size;

  /**
   * Inserts a new item into the SortedArray.
   * If `upsert: true` is provided, updates the item if
   * an item with same key already exists.
   *
   * Throws if `upsert: false` and key already exists.
   */
  insert = (
    newItem: SortedArrayItem<K, V>,
    upsert?: boolean
  ): SortedArray<K, V> => {
    const { item, index } = this.get(newItem.key);
    if (item && !upsert) throw new InvalidArgError('Already exists');
    else if (item) {
      // `upsert` provided, so update existing time
      const newItems = this._items.set(index, newItem);
      return this.updatedClass(newItems);
    } else {
      // Insert new item at index
      const newItems = this._items.insert(index, newItem);
      return this.updatedClass(newItems);
    }
  };

  /**
   * Updates the value of an item in the SortedArray.
   * If `upsert: true` is provided, inserts new item if it does not exist.
   *
   * Throws if `upsert` is not provided and item does not exist.
   */
  update = (itemKey: K, newValue: V, upsert?: boolean): SortedArray<K, V> => {
    const { item, index } = this.get(itemKey);
    if (!item && !upsert) throw new InvalidArgError('Key not found');
    else if (!item) {
      // `upsert` provided, insert new item
      const newItem = { key: itemKey, value: newValue };
      const newItems = this._items.insert(index, newItem);
      return this.updatedClass(newItems);
    } else {
      // Update existing item
      const newItems = this._items.update(index, (item) => ({
        ...item,
        value: newValue,
      }));
      return this.updatedClass(newItems);
    }
  };

  /**
   * Removes an item from the SortedArray. Does nothing
   * if the item does not exist.
   */
  remove = (itemKey: K): SortedArray<K, V> => {
    const { item, index } = this.get(itemKey);
    if (!item) throw new InvalidArgError();
    const newItems = this._items.delete(index);
    return this.updatedClass(newItems);
  };

  /**
   * Returns the start and end index of the subarray, for the
   * element keys of which `searchFn` returns 0. Note that the end
   * index returned is one past the actual subarray limits.
   *
   * Ensure that `searchFn` is consistent, ie will return 0 only for a
   * single contiguous subarray of the full array.
   *
   * @param searchFn Takes a key and returns 0 if it is part of required subarray,
   * -1 if it lies before the required subarray, 1 if it lies after.
   */
  findRange = (searchFn: (kr: K) => number): { start: number; end: number } => {
    const { item, index } = this.get(searchFn);
    if (!item) return { start: index, end: index };

    // We have one position of the required range
    // Touch around to find the full range required
    let startIndex = index;
    while (startIndex > 0) {
      const item = this._items.get(startIndex - 1);
      if (!item) throw new Apocalypse();
      if (searchFn(item.key) === 0) --startIndex;
      else break;
    }
    // Find the subarray end index
    let endIndex = index;
    while (endIndex < this._items.size) {
      const item = this._items.get(endIndex);
      if (!item) throw new Apocalypse();
      if (searchFn(item.key) === 0) ++endIndex;
      else break;
    }

    return { start: startIndex, end: endIndex };
  };
}
