import { OrderedMap } from 'immutable';
import * as Tree from './tree';

type NumberTree = Tree.Tree<number, string>;
type NumberTreeNode = Tree.TreeNode<number, string>;
type NumberTreeInternalNode = Tree.TreeInternalNode<number, string>;

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
  const branchZ: NumberTree = OrderedMap<string, NumberTreeNode>([['w', 5]]);
  const branchB: NumberTree = OrderedMap<string, NumberTreeNode>([
    ['z', branchZ],
    ['x', 3],
    ['y', 4],
  ]);
  const branchC = 6;
  return OrderedMap<string, NumberTreeNode>([
    ['c', branchC],
    ['a', branchA],
    ['b', branchB],
  ]);
};

test('isLeaf identifies leaves from internal nodes', () => {
  expect(Tree.isLeafNode(1)).toBe(true);
  expect(Tree.isLeafNode({})).toBe(true);
  expect(Tree.isLeafNode(OrderedMap())).toBe(false);
});

test('Nodes are accessed by path', () => {
  const tree = createSampleTree();
  expect(Tree.getNodeAt(tree, [])).toBe(tree);
  // Branch at 'a'
  expect(Tree.getNodeAt(tree, ['a'])).toBe(tree.get('a'));
  expect(Tree.getNodeAt(tree, ['a', 'm'])).toBe(1);
  expect(Tree.getNodeAt(tree, ['a', 'n'])).toBe(2);
  // Branch at 'b'
  expect(Tree.getNodeAt(tree, ['b', 'x'])).toBe(3);
  expect(Tree.getNodeAt(tree, ['b', 'y'])).toBe(4);
  expect(Tree.getNodeAt(tree, ['b', 'z'])).toBe(
    (tree.get('b') as NumberTreeInternalNode).get('z')
  );
  expect(Tree.getNodeAt(tree, ['b', 'z', 'w'])).toBe(5);
  // Branch at 'c'
  expect(Tree.getNodeAt(tree, ['c'])).toBe(6);
  // Non-existent paths
  expect(Tree.getNodeAt(tree, ['a', '?'])).toBeNull();
  expect(Tree.getNodeAt(tree, ['c', '?'])).toBeNull();
});

test('Leaves are inserted correctly', () => {
  const tree = createSampleTree();

  // Regular work day: insert leaf at path under root
  const newTree1 = Tree.insertNodeAt(tree, ['d'], 10);
  expect(newTree1).not.toBe(null);
  expect(Tree.getNodeAt(newTree1 as NumberTree, ['d'])).toBe(10);

  // Regular work day: insert leaf at nested path
  const newTree2 = Tree.insertNodeAt(tree, ['a', 'o'], 2.5);
  expect(newTree2).not.toBeNull();
  expect(Tree.getNodeAt(newTree2 as NumberTree, ['a', 'o'])).toBe(2.5);

  // Can't insert leaf at path leading to internal node
  expect(Tree.insertNodeAt(tree, ['a'], 10)).toBeNull();
  // Can't insert leaf at path terminating prematurely
  expect(Tree.insertNodeAt(tree, ['b', 'z', 'w', '?'], 20)).toBeNull();
});

test('Internal nodes are inserted correctly', () => {
  const tree = createSampleTree();

  // Regular work day: insert node at path under root
  const newTree1 = Tree.insertNodeAt(tree, ['d']) as NumberTree;
  expect(newTree1).not.toBeNull();
  const newNode1 = Tree.getNodeAt(newTree1, ['d']) as NumberTree;
  expect(newNode1).not.toBeNull();
  expect(newNode1.toArray().length).toBe(0);

  // Regular work day: insert node at nested path
  const newTree2 = Tree.insertNodeAt(tree, ['a', 'o']) as NumberTree;
  expect(newTree2).not.toBeNull();
  const newNode2 = Tree.getNodeAt(newTree2, ['a', 'o']) as NumberTree;
  expect(newNode2).not.toBeNull();
  expect(newNode2.toArray().length).toBe(0);
});

test('Nodes are deleted correctly', () => {
  const tree = createSampleTree();

  // Regular work day: deleting leaf node at a -> n
  const newTree1 = Tree.deleteNodeAt(tree, ['a', 'n']) as NumberTree;
  expect(newTree1).not.toBeNull();
  expect(Tree.getNodeAt(newTree1, ['a'])).not.toBeNull();
  expect(Tree.getNodeAt(newTree1, ['a', 'm'])).toBe(1);
  expect(Tree.getNodeAt(newTree1, ['a', 'n'])).toBeNull();

  // Regular work day: deleting internal node at b -> z
  const newTree2 = Tree.deleteNodeAt(tree, ['b', 'z']) as NumberTree;
  expect(newTree2).not.toBeNull();
  expect(Tree.getNodeAt(newTree2, ['b'])).not.toBeNull();
  expect(Tree.getNodeAt(newTree2, ['b', 'x'])).toBe(3);
  expect(Tree.getNodeAt(newTree2, ['b', 'y'])).toBe(4);
  expect(Tree.getNodeAt(newTree2, ['b', 'z'])).toBeNull();

  // Can't delete nodes that don't exist
  expect(Tree.deleteNodeAt(tree, ['a', '?'])).toBeNull();
  expect(Tree.deleteNodeAt(tree, ['b', 'x', '?'])).toBeNull();
  // Can't delete the root node
  expect(Tree.deleteNodeAt(tree, [])).toBeNull();
});

test('Leafs are updated correctly', () => {
  const tree = createSampleTree();

  // Can't update leafs that don't exist
  expect(Tree.updateLeafAt(tree, [], 5)).toBe(null);
  expect(Tree.updateLeafAt(tree, ['a'], 5)).toBe(null);
  expect(Tree.updateLeafAt(tree, ['c', '?'], 5)).toBe(null);
  expect(Tree.updateLeafAt(tree, ['b', 'z', 'v'], 4.5)).toBe(null);

  // Regular work day: update value at a -> m
  const newTree = Tree.updateLeafAt(tree, ['a', 'm'], 1.5) as NumberTree;
  expect(newTree).not.toBeNull();
  expect(Tree.getNodeAt(newTree, ['a', 'm'])).toBe(1.5);
});

test('Tree conversion works', () => {
  const tree = createSampleTree();
  const newTree = Tree.convertTree(tree, (num) => num.toString());
  // ... and now to check the values
  // Branch at 'a'
  expect(Tree.getNodeAt(newTree, ['a', 'm'])).toBe('1');
  expect(Tree.getNodeAt(newTree, ['a', 'n'])).toBe('2');
  // Branch at 'b'
  expect(Tree.getNodeAt(newTree, ['b', 'x'])).toBe('3');
  expect(Tree.getNodeAt(newTree, ['b', 'y'])).toBe('4');
  expect(Tree.getNodeAt(newTree, ['b', 'z', 'w'])).toBe('5');
  // Branch at 'c'
  expect(Tree.getNodeAt(newTree, ['c'])).toBe('6');
});

test('Tree serialization works', () => {
  const tree = createSampleTree();
  const leaves = Tree.serializeLeafs(tree, (a, b) => a.localeCompare(b), [
    'base',
  ]);

  expect(leaves).toStrictEqual([
    { path: ['base', 'a', 'm'], value: 1 },
    { path: ['base', 'a', 'n'], value: 2 },
    { path: ['base', 'b', 'x'], value: 3 },
    { path: ['base', 'b', 'y'], value: 4 },
    { path: ['base', 'b', 'z', 'w'], value: 5 },
    { path: ['base', 'c'], value: 6 },
  ]);
});

test('Tree comparison works', () => {
  const baseTree = createSampleTree();
  let otherTree: NumberTree = createSampleTree();

  // Make some changes to other tree
  otherTree = Tree.updateLeafAt(otherTree, ['a', 'm'], -1) as NumberTree;
  otherTree = Tree.deleteNodeAt(otherTree, ['b', 'z']) as NumberTree;
  otherTree = Tree.insertNodeAt(otherTree, ['d']) as NumberTree;
  otherTree = Tree.insertNodeAt(otherTree, ['d', 'd1'], 7) as NumberTree;
  otherTree = Tree.insertNodeAt(otherTree, ['d', 'd2'], 8) as NumberTree;

  // Check the differences
  const differences = Tree.compareTrees(baseTree, otherTree);
  const actualDifferenceSet = new Set(differences);
  const expectedDifferenceSet = new Set([
    { path: ['a', 'm'], type: 'modified' },
    { path: ['b', 'z'], type: 'deleted' },
    { path: ['d'], type: 'added' },
  ]);
  expect(actualDifferenceSet).toEqual(expectedDifferenceSet);
});
