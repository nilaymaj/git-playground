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
  const branchA = new Map<string, NumberTreeNode>([
    ['n', 2],
    ['m', 1],
  ]);
  const branchZ: NumberTree = new Map<string, NumberTreeNode>([['w', 5]]);
  const branchB: NumberTree = new Map<string, NumberTreeNode>([
    ['z', branchZ],
    ['x', 3],
    ['y', 4],
  ]);
  const branchC = 6;
  return new Map<string, NumberTreeNode>([
    ['c', branchC],
    ['a', branchA],
    ['b', branchB],
  ]);
};

test('isLeaf identifies leaves from internal nodes', () => {
  expect(Tree.isLeafNode(1)).toBe(true);
  expect(Tree.isLeafNode({})).toBe(true);
  expect(Tree.isLeafNode(new Map())).toBe(false);
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
  // The happy path
  expect(Tree.insertLeafAt(tree, ['a', 'o'], 2.5)).toBe(true);
  expect(Tree.getNodeAt(tree, ['a', 'o'])).toBe(2.5);
  expect(Tree.insertLeafAt(tree, ['b', 'u', 'v'], 10)).toBe(true);
  expect(Tree.getNodeAt(tree, ['b', 'u', 'v'])).toBe(10);
  // The bad paths
  expect(Tree.insertLeafAt(tree, ['a'], 10)).toBe(false);
  expect(Tree.insertLeafAt(tree, ['b', 'z', 'w', '?'], 20)).toBe(false);
});

test('Nodes are deleted correctly', () => {
  const tree = createSampleTree();
  // The bad paths first...
  expect(Tree.deleteNodeAt(tree, ['a', '?'])).toBe(false);
  expect(Tree.deleteNodeAt(tree, ['b', 'x', '?'])).toBe(false);
  expect(Tree.deleteNodeAt(tree, [])).toBe(false);
  // ...and now the happy paths
  // 1. Deleting leaf node at a -> n
  expect(Tree.deleteNodeAt(tree, ['a', 'n'])).toBe(true);
  expect(Tree.getNodeAt(tree, ['a'])).not.toBeNull();
  expect(Tree.getNodeAt(tree, ['a', 'm'])).not.toBeNull();
  expect(Tree.getNodeAt(tree, ['a', 'n'])).toBeNull();
  // 2. Deleting internal node at b -> z
  expect(Tree.deleteNodeAt(tree, ['b', 'z'])).toBe(true);
  expect(Tree.getNodeAt(tree, ['b'])).not.toBeNull();
  expect(Tree.getNodeAt(tree, ['b', 'x'])).not.toBeNull();
  expect(Tree.getNodeAt(tree, ['b', 'z'])).toBeNull();
});

test('Leafs are updated correctly', () => {
  const tree = createSampleTree();
  // The bad paths first...
  expect(Tree.updateLeafAt(tree, [], 5)).toBe(false);
  expect(Tree.updateLeafAt(tree, ['a'], 5)).toBe(false);
  expect(Tree.updateLeafAt(tree, ['c', '?'], 5)).toBe(false);
  // ... and now the happy paths
  // 1. Update value at a -> m
  expect(Tree.updateLeafAt(tree, ['a', 'm'], 1.5)).toBe(true);
  expect(Tree.getNodeAt(tree, ['a', 'm'])).toBe(1.5);
  // 2. Upsert value at b -> z -> v
  expect(Tree.updateLeafAt(tree, ['b', 'z', 'v'], 4.5)).toBe(false);
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
  const otherTree = createSampleTree();

  // Make some changes to other tree
  Tree.updateLeafAt(otherTree, ['a', 'm'], -1);
  Tree.deleteNodeAt(otherTree, ['b', 'z']);
  Tree.insertLeafAt(otherTree, ['d', 'd1'], 7);
  Tree.insertLeafAt(otherTree, ['d', 'd2'], 8);

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
