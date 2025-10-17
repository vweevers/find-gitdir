'use strict'

const find = require('find-file-up')
const fromCallback = require('catering').fromCallback
const path = require('path')
const fs = require('fs')

module.exports = function gitdir (cwd, options, callback) {
  if (typeof cwd === 'function') return gitdir(null, null, cwd)
  if (typeof options === 'function') return gitdir(cwd, null, options)

  cwd = path.resolve(cwd || '.')
  options = getOptions(options)
  callback = fromCallback(callback)

  if (path.basename(cwd) === '.git') {
    next(null, cwd)
  } else if (options.roam) {
    find('.git', cwd, next)
  } else {
    next(null, path.join(cwd, '.git'))
  }

  return callback.promise

  function next (err, git) {
    if (err) return callback(err)
    if (!git) return callback(null, null)

    // Could be a file acting as a "filesystem-agnostic git symbolic link" when
    // the working directory is a git submodule or --separate-git-dir was used
    fs.readFile(git, 'utf8', function (err, symlink) {
      if (err) {
        if (err.code === 'ENOENT') {
          return callback(null, null)
        } else if (err.code === 'EISDIR') {
          symlink = null
        } else {
          return callback(err)
        }
      }

      if (symlink !== null) {
        git = resolveSymlink(git, symlink)
      }

      if (git && options.common) {
        resolveCommonDir(git, callback)
      } else {
        callback(null, git)
      }
    })
  }
}

module.exports.sync = function (cwd, options) {
  cwd = path.resolve(cwd || '.')
  options = getOptions(options)

  let git
  let symlink = null

  if (path.basename(cwd) === '.git') {
    git = cwd
  } else if (options.roam) {
    git = find.sync('.git', cwd)
  } else {
    git = path.join(cwd, '.git')
  }

  if (!git) {
    return null
  }

  try {
    symlink = fs.readFileSync(git, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return null
    if (err.code !== 'EISDIR') throw err
  }

  if (symlink !== null) {
    git = resolveSymlink(git, symlink)
  }

  if (git && options.common) {
    git = resolveCommonDirSync(git)
  }

  return git
}

function getOptions (options) {
  // Backwards compatibility
  if (typeof options === 'boolean') {
    return { roam: options }
  } else {
    return options != null ? options : {}
  }
}

function resolveSymlink (git, symlink) {
  // For example "gitdir: ../.git/modules/beep" in the case of a submodule or
  // "gitdir: /foo/.git/worktrees/my-worktree" in the case of a worktree.
  const match = /^gitdir:\s*([^\s]+)$/im.exec(symlink)

  if (match !== null) {
    return path.resolve(git, '..', match[1])
  } else {
    return null
  }
}

function resolveCommonDirSync (gitdir) {
  // In the case of a linked worktree, its gitdir contains a 'commondir' file
  // which is a fake symlink (typically '../..') that points to the gitdir of
  // the main worktree, which is also known as $GIT_COMMON_DIR:
  //
  // > If this variable is set to a path, non-worktree files that are normally
  // > in $GIT_DIR will be taken from this path instead.
  //
  // $GIT_COMMON_DIR is where things like `config` and thus remotes are found.
  //
  // See https://git-scm.com/docs/gitrepository-layout.
  const commonDir = path.join(gitdir, 'commondir')
  let content

  try {
    content = fs.readFileSync(commonDir, 'utf8')
  } catch (err) {
    // If commondir doesn't exist, assume we're already in the gitdir of the
    // main worktree.
    if (err.code === 'ENOENT') return gitdir

    throw err
  }

  return path.resolve(gitdir, content.trim())
}

function resolveCommonDir (gitdir, callback) {
  const commonDir = path.join(gitdir, 'commondir')

  fs.readFile(commonDir, 'utf8', function (err, content) {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(null, gitdir)
      } else {
        return callback(err)
      }
    }

    callback(null, path.resolve(gitdir, content.trim()))
  })
}
