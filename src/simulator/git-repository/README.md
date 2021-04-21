# Git Internals

This directory contains code that implements the Git version control system - a simpler form, obviously.
Git operations are split into two broad parts:

- **Plumbing**: Internal functionality like object storage and commit graphs that act as the base for porcelain operations.
- **Porcelain**: Implementation of user-facing operations, using the underlying plumbing commands.

## Porcelain

### Committing changes

- [x] `add` a file/directory:
  1. Create Git blob for file(s)
  2. Add file(s) metadata to index
- [x] `reset` to previous commit:
  1. Get working tree from current commit
  2. Reset HEAD and/or active ref to target
  3. Depending on reset mode, apply tree to index and FS
- [x] `commit`:
  1. Create tree object from index
  2. Create commit object with tree object and parent commit
  3. Update current branch tag to latest commit

### Checking out past history

- [x] `checkout`: Generate file system from work tree at HEAD commit
  - TODO: Make sure file system and index are clean before proceeding

### Branch operations

- [ ] `branch`: Create new branch ref, pointing to current commit
- [ ] `merge`, `rebase`: TODO: Unimplemented

## Components

### Object storage

The core of Git is a content-addressable key-value database, called the object storage.
Every object (blob, tree, commit) in Git is stored against a hash of itself in the database.

This has advantages:

- All single-object operations are constant-time. These operations are the bulk of Git.
- Almost zero space wastage, since redundant data is stored on the same key.

Types of objects in Git:

- **Blob**: Represents the contents of a file. Does not include file name, etc.
- **Tree**: Represents a directory. Mainly consists of list of direct children,
  where each child has a name and hash of the corresponding blob or tree.
- **Commit**: Represents a commit - author, message, etc along with hash of associated working tree.

### Ref storage

Stores information for all refs ("branches"), organized in a tree format. At
the leafs lie the refs, where each ref points to a commit hash.

### Index File

This is the one not-so-intuitive part of Git internals. The index file maintains
a sorted list of all **tracked files** in the repository. An example of the contents is:

```
100644 a69de71385651014675448e192474314ca0ddbc4 0	src/simulator/utils/sorted-array.ts
100644 fafd24cc5d7a4baf60e7b2025a3d9b771afdf3b3 0	src/simulator/utils/tree.test.ts
100644 7517d60454a35e10c3c5f384334fe98eb647fd1a 0	src/simulator/utils/tree.ts
100644 2d519b5ad927210dfc8c46dd1962fabe6f0f33b5 0	tsconfig.json
100644 e84d9e718d77ffe53e6d761a3bc9618ded823c1e 0	yarn.lock
```

- The `100644` field contains mainly information about the file mode and permissions.
- Next is the hash of the blob that the entry corresponds to.
- The `0` field is a Git utility field used to track status of files in merges, rebases, etc.
- The final field stores the path of the file.

Some key points:

- Only **files** are stored. The index file does not store information about directories.
- Only **tracked** files are stored. Untracked and ignored files are not added to index.
- When `git commit` is executed, it is the index file that directly forms the tree added to the commit.

The index file plays a key role in the output of `git status`:

- **Untracked (unstaged)**: Compare FS and index
- **Modified (unstaged)**: Compare FS and index
- **Deleted (unstaged)**: Compare FS and index
- **All staged changes**: Compare index and work tree
