import { OrderedMap } from 'immutable';
import { InvalidArgError } from './errors';

/**
 * An internal node of the tree, containing
 * named references to children
 */
export type TreeInternalNode<L, N> = OrderedMap<N, TreeNode<L, N>>;

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
 * Immutable data structure for representing a tree
 * with data stored at the leaves. Each branch of every
 * internal node has a name.
 * - L: the type of data stored at leaf node
 * - N: the type of branch names in internal nodes
 */
export default class Tree<L, N> {
  _tree: TreeInternalNode<L, N>;

  /**
   * Create a new Tree, optionally with the given
   * ImmutableJS OrderedMap tree representation.
   */
  constructor(tree?: TreeInternalNode<L, N>) {
    if (!tree) this._tree = OrderedMap<N, TreeNode<L, N>>();
    else this._tree = tree;
  }

  /**
   * Creates a clone of this tree.
   */
  clone = (tree: Tree<L, N>) => {
    return new Tree(tree._tree);
  };

  /**
   * Check if the given node is an internal node of a Tree.
   * Returns `false` if the given node is `null`.
   */
  static isInternalNode = <L, N>(
    node: TreeNode<L, N> | null
  ): node is TreeInternalNode<L, N> => {
    if (!node) return false;
    return node instanceof OrderedMap;
  };

  /**
   * Check if the given node is a leaf node of a Tree.
   * Returns `false` if the given node is `null`.
   */
  static isLeafNode = <L, N>(node: TreeNode<L, N> | null): node is L => {
    if (!node) return false;
    return !(node instanceof OrderedMap);
  };

  /**
   * Immutability helper method: use this to return a new
   * Tree class with the updated underlying tree data.
   */
  private updatedClass = (tree: TreeInternalNode<L, N>) => {
    if (this._tree === tree) return this;
    else return new Tree(tree);
  };

  /**
   * Get the node located at specified path in the tree.
   * Returns `null` if the path does not exist.
   */
  get = (path: TreePath<N>): TreeNode<L, N> | null => {
    if (path.length === 0) return this._tree;
    return this._tree.getIn(path, null);
  };

  /**
   * Insert a new node at the specified path in the tree.
   * If node is not provided, creates an empty subtree at the path.
   * Does not create any intermediate directories.
   *
   * Throws error if the path is invalid or node already exists.
   */
  insert = (path: TreePath<N>, node?: TreeNode<L, N>): Tree<L, N> => {
    if (path.length === 0) throw new InvalidArgError();
    // Check if parent node is valid
    const parentNode = this.get(path.slice(0, -1));
    if (!Tree.isInternalNode(parentNode)) throw new InvalidArgError();
    // Check if node already exists at path
    const nodeName = path[path.length - 1];
    if (parentNode.has(nodeName)) throw new Error('Node already exists');
    // Insert node and return new tree
    const nodeToInsert = node === undefined ? OrderedMap() : node;
    const newTree = this._tree.setIn(path, nodeToInsert);
    return this.updatedClass(newTree);
  };

  /**
   * Remove the leaf or subtree located at specified path in the tree.
   *
   * Throws if path is empty or does not exist.
   */
  remove = (path: TreePath<N>): Tree<L, N> => {
    if (path.length === 0) throw new InvalidArgError();
    if (!this.get(path)) throw new InvalidArgError();
    const newTree = this._tree.deleteIn(path);
    return this.updatedClass(newTree);
  };

  /**
   * Update the node at the specified path to provided value.
   * The value can be leaf data or a subtree.
   *
   * Throws if the path is invalid or the node does not exist.
   */
  update = (path: TreePath<N>, value: TreeNode<L, N>): Tree<L, N> => {
    if (path.length === 0) throw new InvalidArgError();
    const node = this.get(path);
    if (node === null) throw new InvalidArgError();
    const newTree = this._tree.updateIn(path, null, () => value);
    return this.updatedClass(newTree);
  };

  /**
   * Runs provided converter function on each leaf, to return
   * a new Tree with the same structure but converted leaf data.
   */
  convert = <Ld>(convert: (leaf: L) => Ld): Tree<Ld, N> => {
    const convertNode = (node: TreeNode<L, N>): TreeNode<Ld, N> => {
      if (Tree.isLeafNode(node)) return convert(node);
      else return node.map(convertNode);
    };

    const newTree = this._tree.map(convertNode);
    return new Tree(newTree);
  };

  /**
   * Serializes the tree into an array of its leaves.
   * If `compareNames` is provided, sorts the leaves by path.
   */
  toLeafArray = (
    compareNames?: (a: N, b: N) => number,
    basePath: TreePath<N> = []
  ): { path: TreePath<N>; value: L }[] => {
    return Tree.treeToLeafs(this._tree, basePath, compareNames);
  };

  /**
   * Serialize an Immutable.JS tree into array of leaves.
   * `basePath` is prefixed to the path of every leaf.
   */
  private static treeToLeafs = <L, N>(
    tree: TreeNode<L, N>,
    basePath: TreePath<N>,
    compareNames?: (a: N, b: N) => number
  ): { path: TreePath<N>; value: L }[] => {
    // Leaf nodes serialize to a single leaf
    if (Tree.isLeafNode(tree)) return [{ path: basePath, value: tree }];
    // Get (and optionally sort) direct children of node
    const treeChildren = [...tree.entries()];
    if (compareNames) treeChildren.sort((a, b) => compareNames(a[0], b[0]));
    // Recursively serialize subtrees and pack them together
    return treeChildren.flatMap(([name, node]) =>
      Tree.treeToLeafs(node, [...basePath, name], compareNames)
    );
  };
}
