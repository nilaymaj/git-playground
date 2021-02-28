/**
 * The root of the tree.
 * - L: the type of leaf node
 * - N: the type of path names in internal nodes
 */
export type Tree<L, N> = TreeInternalNode<L, N>;

/**
 * An internal node of the tree, containing
 * named references to children
 */
export type TreeInternalNode<L, N> = Map<N, TreeNode<L, N>>;

/**
 * A general node of the tree. May be internal or leaf node.
 */
export type TreeNode<L, N> = L | TreeInternalNode<L, N>;

/**
 * Path to an item in the tree. Elements
 * are segment names in the path.
 */
export type TreePath<N> = N[];

/**
 * Creates a linear tree that only includes a leaf
 * node corresponding to the specified path.
 */
const createTreeNodeFromLeaf = <L, N>(
  path: TreePath<N>,
  value: L
): TreeNode<L, N> => {
  if (path.length === 0) return value;
  const [childName, ...subPath] = path;
  const subTree = createTreeNodeFromLeaf(subPath, value);
  return new Map([[childName, subTree]]);
};

/**
 * Traverses given tree node to return node located at given path.
 * Returns `null` if path is invalid.
 */
const getNodeInSubtree = <L, N>(
  node: TreeNode<L, N>,
  path: TreePath<N>
): TreeNode<L, N> | null => {
  if (path.length === 0) return node;
  if (isLeafNode(node)) return null;
  const childNode = node.get(path[0]);
  if (!childNode) return null;
  return getNodeInSubtree(childNode, path.slice(1));
};

/**
 * Check if given node is leaf node
 */
export const isLeafNode = <L, N>(node: TreeNode<L, N>): node is L => {
  return !(node instanceof Map);
};

/**
 * Traverses tree to return node at given path.
 * Returns `null` if path is invalid.
 */
export const getNodeAt = <L, N>(
  tree: Tree<L, N>,
  path: TreePath<N>
): TreeNode<L, N> | null => {
  return getNodeInSubtree(tree, path);
};

/**
 * Inserts new leaf node with given value at specified path.
 * Creates path if does not exist already.
 *
 * Returns `true` on success, fails if path leads to internal
 * node or terminates prematurely at another leaf node.
 */
export const insertLeafAt = <L, N>(
  tree: Tree<L, N>,
  path: TreePath<N>,
  value: L
): boolean => {
  const [childName, ...subPath] = path;
  const subNode = tree.get(childName);
  if (!subNode) {
    // Create subtree of node to be created
    const subTree = createTreeNodeFromLeaf(subPath, value);
    // Attach subtree to current node, and done.
    tree.set(childName, subTree);
    return true;
  }
  if (isLeafNode(subNode)) return false;
  // If path terminates at leaf node, abort
  if (subPath.length === 0) return false;
  // Else recurse into the subtree
  return insertLeafAt(subNode, subPath, value);
};

/**
 * Deletes subtree (or leaf) at given path.
 * Return true on success, fails if path is invalid.
 */
export const deleteNodeAt = <L, N>(tree: Tree<L, N>, path: TreePath<N>) => {
  // Self-destruction is not allowed
  if (path.length === 0) return false;
  // Traverse and get parent of required node
  const parentNode = getNodeAt(tree, path.slice(0, -1));
  if (!parentNode || isLeafNode(parentNode)) return false;
  // Delete given child
  const childName = path[path.length - 1];
  return parentNode.delete(childName);
};

/**
 * Updates tree leaf located at given path.
 * If `upsert` is true, inserts leaf if does not exist
 * (parent node must exist)
 *
 * Returns true on success, fails if path is invalid.
 */
export const updateLeafAt = <L, N>(
  tree: Tree<L, N>,
  path: TreePath<N>,
  value: L
): boolean => {
  // Root is not a leaf
  if (path.length === 0) return false;
  // Traverse and get parent of required node
  const parentNode = getNodeAt(tree, path.slice(0, -1));
  if (!parentNode || isLeafNode(parentNode)) return false;
  // Update or insert child
  const childName = path[path.length - 1];
  const childLeaf = parentNode.get(childName);
  if (!childLeaf) return false;
  if (childLeaf && !isLeafNode(childLeaf)) return false;
  parentNode.set(childName, value);
  return true;
};

/**
 * Converts a tree to another tree with different leaf type,
 * using the given leaf-converting function.
 */
export const convertTree = <Ls, Ld, N>(
  sourceTree: Tree<Ls, N>,
  convert: (leaf: Ls) => Ld
): Tree<Ld, N> => {
  return Array.from(sourceTree).reduce((destNode, child) => {
    const [childName, subTree] = child;
    if (isLeafNode(subTree)) return destNode.set(childName, convert(subTree));
    else return destNode.set(childName, convertTree(subTree, convert));
  }, new Map());
};

/**
 * Serializes a tree into an array of its leafs, sorted by path.
 * Each element of the returned array consists of its full path and value.
 *
 * If `basePath` is provided, prefixes `basePath` to each leaf item's path.
 */
export const serializeLeafs = <L, N>(
  tree: Tree<L, N>,
  compareNames: (a: N, b: N) => number,
  basePath: TreePath<N> = []
): { path: TreePath<N>; value: L }[] => {
  return Array.from(tree)
    .slice() // `sort` sorts in place, so make a copy
    .sort((a, b) => compareNames(a[0], b[0])) // sort children by child name
    .reduce<{ path: TreePath<N>; value: L }[]>((currentArray, child) => {
      if (isLeafNode(child[1])) {
        // Create serialization item and add to current array
        const leafItem = { path: [...basePath, child[0]], value: child[1] };
        return [...currentArray, leafItem];
      } else {
        // Recursively serialize subtree and attach to current array
        const subBasePath = [...basePath, child[0]]; // Extend base path for subtree
        const subSerialized = serializeLeafs(
          child[1],
          compareNames,
          subBasePath
        );
        return [...currentArray, ...subSerialized];
      }
    }, []);
};

/**
 * Compares a tree against a base tree to
 * calculate added, deleted and modified nodes.
 */
export const compareTrees = <L, N>(
  baseTree: Tree<L, N>,
  otherTree: Tree<L, N>
): TreeComparisonItem<N>[] => {
  return compareTreesAux(baseTree, otherTree, []);
};

/**
 * Helper recursive function for `compareTrees`, that takes
 * a base path to attach to all comparison item paths.
 */
const compareTreesAux = <L, N>(
  baseTree: Tree<L, N>,
  otherTree: Tree<L, N>,
  basePath: TreePath<N>
): TreeComparisonItem<N>[] => {
  const baseChildren = Array.from(baseTree).sort();
  const otherChildren = Array.from(otherTree).sort();
  const mergedChildren = mergeSortedChildrenLists(baseChildren, otherChildren);
  return mergedChildren.flatMap<TreeComparisonItem<N>>((mergeItem) => {
    const { name, baseItem, otherItem } = mergeItem;
    if (!baseItem && !otherItem) return [];
    if (!baseItem) return [{ path: [...basePath, name], type: 'added' }];
    if (!otherItem) return [{ path: [...basePath, name], type: 'deleted' }];
    if (isLeafNode(baseItem) && isLeafNode(otherItem)) {
      if (baseItem === otherItem) return [];
      else return [{ path: [...basePath, name], type: 'modified' }];
    } else if (!isLeafNode(baseItem) && !isLeafNode(otherItem)) {
      return compareTreesAux(baseItem, otherItem, [...basePath, name]);
    } else {
      return [
        { path: [...basePath, name], type: 'deleted' },
        { path: [...basePath, name], type: 'added' },
      ];
    }
  });
};

/**
 * Helper function for `compareTreesAux`, merges
 * two sorted arrays of children into a single array.
 *
 * ```
 * baseChildren: [[1, 'a'], [2, 'b']],
 * otherChildren: [[1, 'aa'], [3, 'c']]
 * => [
 *   { name: 1, baseItem: 'a', otherItem: 'aa'},
 *   { name: 2, baseItem: 'b', otherItem: null },
 *   { name: 3, baseItem: null, otherItem: 'c'}
 * ]
 * ```
 */
const mergeSortedChildrenLists = <L, N>(
  baseChildren: [N, TreeNode<L, N>][],
  otherChildren: [N, TreeNode<L, N>][]
): ChildComparisonItem<L, N>[] => {
  let [baseIndex, otherIndex] = [0, 0];
  const mergedList = [];
  while (baseIndex < baseChildren.length || otherIndex < otherChildren.length) {
    // Get the elements
    const baseElement = getArrayItem(baseChildren, baseIndex);
    const [baseName, baseItem] = baseElement || [null, null];
    const otherElement = getArrayItem(otherChildren, otherIndex);
    const [otherName, otherItem] = otherElement || [null, null];
    // Create and push merge element to target array
    if (!baseName && !otherName) break;
    else if (!baseName || !otherName || baseName === otherName) {
      // One of the arrays is exhausted
      // OR both items exist and are identical
      const name = (baseName || otherName) as N;
      mergedList.push({ name, baseItem, otherItem });
      baseIndex++;
      otherIndex++;
      continue;
    } else if (baseName < otherName) {
      // Base array has a new item
      mergedList.push({ name: baseName, baseItem, otherItem: null });
      baseIndex++;
      continue;
    } else if (baseName > otherName) {
      // Other array has a new item
      mergedList.push({ name: otherName, baseItem: null, otherItem });
      otherIndex++;
      continue;
    }
  }
  return mergedList;
};

/**
 * An array getter function that returns `null` for invalid indexes.
 * This is done as an alternative to setting `noUncheckedIndexedAccess: true` in TS config.
 */
const getArrayItem = <T>(array: T[], index: number): T | null => {
  let item = array[index];
  if (!item) return null;
  return item;
};

type ChildComparisonItem<L, N> = {
  name: N;
  baseItem: TreeNode<L, N> | null;
  otherItem: TreeNode<L, N> | null;
};

type TreeComparisonItem<N> = {
  path: TreePath<N>;
  type: 'added' | 'modified' | 'deleted';
};
