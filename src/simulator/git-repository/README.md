# Git Internals

This directory contains code that implements the Git version control system - a simpler form, obviously.
Git operations are split into two broad parts:

- **Plumbing**: Internal functionality like object storage and commit graphs that act as the base for porcelain operations.
- **Porcelain**: Implementation of user-facing operations, using the underlying plumbing commands.

## Porcelain

### Committing changes

- [ ] `add` a file/directory:
  1. Create Git blob for file(s)
  2. Add file(s) metadata to index
- [ ] `restore` a file/directory:
  1. TODO
- [ ] `commit`:
  1. Create tree object from index
  2. Create commit object with tree object and parent commit
  3. Update current branch tag to latest commit

### Checking out past history

- [ ] `checkout`: Generate file system from work tree at HEAD commit
  - Make sure file system is absolutely clean (no changes, no staged changes)

### Branch operations

- [ ] `branch`: Create new branch ref, pointing to current commit
- [ ] `merge`, `rebase`: TODO

## Plumbing

TODO

## Components

### Object storage

- [x] Get object stored at hash
- [x] Hash and store object

### Ref storage

- [x] Get contents (commit/refs) at given ref path
- [x] Update ref to given commit hash address

### Index

Firstly, what the index is:

- Maintains a list/tree of all **tracked** files
- Associates latest blob (current for unchanged, staged for changed) to list item

How to compute `git status` info:

- **Untracked (unstaged)**: Compare FS and index
- **Modified (unstaged)**: Compare FS and index
- **Deleted (unstaged)**: Compare FS and index
- **All staged changes**: Compare index and work tree

Required functionality:

- [ ] Upsert entry for given file
- [ ] Remove entry for given file

========================================

## Plumbing TODO

- [ ] git-checkout-index(1)
      Copy files from the index to the working tree.

- [ ] git-commit-tree(1)
      Create a new commit object.

- [ ] git-hash-object(1)
      Compute object ID and optionally creates a blob from a file.

- [ ] git-read-tree(1)
      Reads tree information into the index.

- [ ] git-update-index(1)
      Register file contents in the working tree to the index.

- [ ] git-update-ref(1)
      Update the object name stored in a ref safely.

- [ ] git-write-tree(1)
      Create a tree object from the current index.
