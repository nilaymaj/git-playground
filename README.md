# Git Playground

A very simple web app to play around with the basic Git commands. Execute commands like `add`,
`commit`, `checkout` and `reset` to see how the file system, object storage and index file change.

Hosted on GitHub Pages - [play around](https://nilaymaj.github.io/git-playground).

This project is only semi-functional. While the basic command usages work, a lot of basic Git
functionality (like creating branches) is incomplete. Also, the UI for staging area and commit
view is entirely unimplemented.

![screenshot](https://github.com/nilaymaj/git-playground/blob/master/screenshot.png?raw=true)

This idea seemed good before I started the project, but I realized en route that beyond the extreme
basic Git commands, such an app loses its utility. Commit-graph dedicated tools like
[Learn Git Branching](https://github.com/pcottle/learnGitBranching) perform a much, much better job
at teaching Git than this project ever will, if I continued this.

The codebase has two broad parts:

- **The Git shim (`src/simulator`)**: A basic implementation of the Git internal architecture - object storage, refs,
  index file and some basic porcelain commands. More details at `src/simulator/README.md`.
- **The web UI (`src/app`)**: React frontend for the user.

### Launching the app

Quite straightforward. You need a modern version of [Node](https://nodejs.org) and preferably Yarn. To run the app:

```bash
cd src/app
yarn start # (or npm start, if not using Yarn)
```

View the app at [localhost:3000](http://localhost:3000).

The codebase also contains tests for the Git shim. Helpful if, by any chance, you are looking to contribute.
Run `yarn test` to run the tests. The tests are written in `*.test.ts` files located near the relevant parts of code.

### Missing stuff

- The UI for staging area and commit view ("repository view")
- Parsing of relative file paths and commit paths (eg: `HEAD^2`)

### Future improvements

- **Support for branches**: Most of the code is written with branches in mind, so shouldn't be too difficult.
- **Improve command implementations**:
  - Some super-useful file system command flags that are not currently supported.
  - The `git reset` command does not support resetting specific file paths, similar for some other commands.
- **Add more commands**:
  - `rm`, `restore`, `status`, `switch` seem like the next commands to add.
  - `log`, `merge`, `rebase` require writing helper code for handling the commit graph.
