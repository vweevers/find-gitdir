# find-gitdir

**Find `.git` directory with support of submodules, [`--separate-git-dir`](https://git-scm.com/docs/git-init#Documentation/git-init.txt---separate-git-dirltgitdirgt) and [linked worktrees](https://git-scm.com/docs/git-worktree).**

[![npm status](http://img.shields.io/npm/v/find-gitdir.svg)](https://www.npmjs.org/package/find-gitdir)
[![node](https://img.shields.io/node/v/find-gitdir.svg)](https://www.npmjs.org/package/find-gitdir)
![Test](https://github.com/vweevers/find-gitdir/workflows/Test/badge.svg?branch=main)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Usage

```js
const gitdir = require('find-gitdir')
```

Let's say we have a git repository at `/example` and that this is our working directory. Its gitdir will commonly be at `/example/.git`.

```js
await gitdir() // /example/.git
```

Let's also say we have a git submodule at `./beep`. Then `find-gitdir` will find a symbolic link at `./beep/.git` pointing to the gitdir `../.git/modules/beep`:

```js
await gitdir('./beep') // /example/.git/modules/beep
```

By default `find-gitdir` does not look in parent directories. It can be enabled:

```js
await gitdir('./node_modules/find-gitdir')       // null
await gitdir('./node_modules/find-gitdir', { roam: true }) // /example/.git
```

## API

### `gitdir([cwd][, options][, callback])`

Yields an absolute path to a `.git` directory or `null` if not found, given working directory `cwd` which defaults to `process.cwd()`. If no callback if provided, a promise is returned. Options:

- `roam` (boolean, default `false`): enable looking in parent directories
- `common` (boolean, default `false`): if `cwd` is a [linked worktree](https://git-scm.com/docs/git-worktree) then return the gitdir of the main worktree (a.k.a. [`$GIT_COMMON_DIR`](https://git-scm.com/docs/gitrepository-layout)) instead of the gitdir of the linked worktree. This can be useful if you need non-worktree files like `config`.

If `options` is a boolean, it is interpreted as `options.roam` for backwards compatibility.

### `gitdir.sync([cwd][, options])`

Synchronous variant. Returns an absolute path or `null`.

## Install

With [npm](https://npmjs.org) do:

```
npm install find-gitdir
```

## License

[MIT](LICENSE) © Vincent Weevers
