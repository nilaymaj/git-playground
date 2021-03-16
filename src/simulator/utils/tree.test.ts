import { OrderedMap } from 'immutable';
import { InvalidPathError } from './errors';
import { TreeInternalNode, TreeNode } from './tree';
import Tree from './tree';

type NumberTree = Tree<number, string>;
type NumberTreeNode = TreeNode<number, string>;
type NumberTreeInternalNode = TreeInternalNode<number, string>;

/**
 * Create a sample number tree, as follows:
 *
 * ```
 * {
 *   a: { m: 1, n: 2 },
 *   b: { x: 3, y: 4, z: { w: 5 } },
 *   c: 6
 * }
 * ```
 */
const createSampleTree = (): NumberTree => {
  const branchA = OrderedMap<string, NumberTreeNode>([
    ['n', 2],
    ['m', 1],
  ]);
  const branchZ = OrderedMap<string, NumberTreeNode>([['w', 5]]);
  const branchB = OrderedMap<string, NumberTreeNode>([
    ['z', branchZ],
    ['x', 3],
    ['y', 4],
  ]);
  const branchC = 6;
  const fullTree = OrderedMap<string, NumberTreeNode>([
    ['c', branchC],
    ['a', branchA],
    ['b', branchB],
  ]);
  return new Tree(fullTree);
};

test('isLeaf identifies leaves from internal nodes', () => {
  expect(Tree.isLeafNode(1)).toBe(true);
  expect(Tree.isLeafNode({})).toBe(true);
  expect(Tree.isLeafNode(OrderedMap())).toBe(false);
});

test('Nodes are accessed by path', () => {
  const tree = createSampleTree();
  expect(tree.get([])).toBe(tree._tree);
  // Branch at 'a'
  expect(tree.get(['a'])).toBe(tree._tree.get('a'));
  expect(tree.get(['a', 'm'])).toBe(1);
  expect(tree.get(['a', 'n'])).toBe(2);
  // Branch at 'b'
  expect(tree.get(['b', 'x'])).toBe(3);
  expect(tree.get(['b', 'y'])).toBe(4);
  expect(tree.get(['b', 'z'])).toBe(
    (tree._tree.get('b') as NumberTreeInternalNode).get('z')
  );
  expect(tree.get(['b', 'z', 'w'])).toBe(5);
  // Branch at 'c'
  expect(tree.get(['c'])).toBe(6);
  // Non-existent paths
  expect(tree.get(['a', '?'])).toBeNull();
  expect(tree.get(['c', '?'])).toBeNull();
});

test('Leaves are inserted correctly', () => {
  const tree = createSampleTree();

  // Regular work day: insert leaf at path under root
  const newTree1 = tree.insert(['d'], 10);
  expect(newTree1.get(['d'])).toBe(10);

  // Regular work day: insert leaf at nested path
  const newTree2 = tree.insert(['a', 'o'], 2.5);
  expect(newTree2.get(['a', 'o'])).toBe(2.5);

  // Can't insert leaf at path leading to internal node
  expect(() => tree.insert(['a'], 10)).toThrow();
  // Can't insert leaf at path terminating prematurely
  expect(() => tree.insert(['b', 'z', 'w', '?'], 20)).toThrowError(
    InvalidPathError
  );
});

test('Internal nodes are inserted correctly', () => {
  const tree = createSampleTree();

  // Regular work day: insert node at path under root
  const newTree1 = tree.insert(['d']) as NumberTree;
  const newNode1 = newTree1.get(['d']) as NumberTreeInternalNode;
  expect(newNode1).not.toBeNull();
  expect(newNode1.toArray().length).toBe(0);

  // Regular work day: insert node at nested path
  const newTree2 = tree.insert(['a', 'o']);
  const newNode2 = newTree2.get(['a', 'o']) as NumberTreeInternalNode;
  expect(newNode2).not.toBeNull();
  expect(newNode2.toArray().length).toBe(0);
});

test('Nodes are deleted correctly', () => {
  const tree = createSampleTree();

  // Regular work day: deleting leaf node at a -> n
  const newTree1 = tree.remove(['a', 'n']);
  expect(newTree1.get(['a'])).not.toBeNull();
  expect(newTree1.get(['a', 'm'])).toBe(1);
  expect(newTree1.get(['a', 'n'])).toBeNull();

  // Regular work day: deleting internal node at b -> z
  const newTree2 = tree.remove(['b', 'z']);
  expect(newTree2.get(['b'])).not.toBeNull();
  expect(newTree2.get(['b', 'x'])).toBe(3);
  expect(newTree2.get(['b', 'y'])).toBe(4);
  expect(newTree2.get(['b', 'z'])).toBeNull();

  // Can't delete nodes that don't exist
  expect(() => tree.remove(['a', '?'])).toThrowError(InvalidPathError);
  expect(() => tree.remove(['b', 'x', '?'])).toThrowError(InvalidPathError);
  // Can't delete the root node
  expect(() => tree.remove([])).toThrowError(InvalidPathError);
});

test('Leafs are updated correctly', () => {
  const tree = createSampleTree();

  // Can't update root node
  expect(() => tree.update([], 5)).toThrowError(InvalidPathError);
  // Can't update nodes that don't exist
  expect(() => tree.update(['c', '?'], 5)).toThrowError(InvalidPathError);

  // Regular work day: update value at a -> m to leaf
  const newTree1 = tree.update(['a', 'm'], 1.5);
  expect(newTree1.get(['a', 'm'])).toBe(1.5);

  // Regular work day: update value at a -> n to empty tree
  const newTree2 = tree.update(['a', 'n'], OrderedMap());
  const newNode = newTree2.get(['a', 'n']) as NumberTreeInternalNode;
  expect(Tree.isInternalNode(newNode)).toBe(true);
  expect(newNode.size).toBe(0);
});

test('Tree conversion works', () => {
  const tree = createSampleTree();
  const newTree = tree.convert((n) => n.toString());

  expect(newTree.get(['a', 'm'])).toBe('1');
  expect(newTree.get(['a', 'n'])).toBe('2');
  expect(newTree.get(['b', 'x'])).toBe('3');
  expect(newTree.get(['b', 'y'])).toBe('4');
  expect(newTree.get(['b', 'z', 'w'])).toBe('5');
  expect(newTree.get(['c'])).toBe('6');
});

test('Tree serialization works', () => {
  const tree = createSampleTree();
  const leaves = tree.toLeafArray((a, b) => a.localeCompare(b));

  expect(leaves).toStrictEqual([
    { path: ['a', 'm'], value: 1 },
    { path: ['a', 'n'], value: 2 },
    { path: ['b', 'x'], value: 3 },
    { path: ['b', 'y'], value: 4 },
    { path: ['b', 'z', 'w'], value: 5 },
    { path: ['c'], value: 6 },
  ]);
});

// test('Tree comparison works', () => {
//   const baseTree = createSampleTree();
//   let otherTree: NumberTree = createSampleTree();

//   // Make some changes to other tree
//   otherTree = Tree.updateLeafAt(otherTree, ['a', 'm'], -1) as NumberTree;
//   otherTree = Tree.deleteNodeAt(otherTree, ['b', 'z']) as NumberTree;
//   otherTree = Tree.insertNodeAt(otherTree, ['d']) as NumberTree;
//   otherTree = Tree.insertNodeAt(otherTree, ['d', 'd1'], 7) as NumberTree;
//   otherTree = Tree.insertNodeAt(otherTree, ['d', 'd2'], 8) as NumberTree;

//   // Check the differences
//   const differences = Tree.compareTrees(baseTree, otherTree);
//   const actualDifferenceSet = new Set(differences);
//   const expectedDifferenceSet = new Set([
//     { path: ['a', 'm'], type: 'modified' },
//     { path: ['b', 'z'], type: 'deleted' },
//     { path: ['d'], type: 'added' },
//   ]);
//   expect(actualDifferenceSet).toEqual(expectedDifferenceSet);
// });
