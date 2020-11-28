'use strict'

const find = require('find-file-up')
const fromCallback = require('catering').fromCallback
const path = require('path')
const fs = require('fs')

module.exports = function gitdir (cwd, roam, callback) {
  if (typeof cwd === 'function') return gitdir(null, null, cwd)
  if (typeof roam === 'function') return gitdir(cwd, null, roam)

  cwd = cwd || '.'
  callback = fromCallback(callback)

  if (roam) {
    find('.git', cwd, next)
  } else {
    next(null, path.resolve(cwd, '.git'))
  }

  return callback.promise

  function next (err, git) {
    if (err) return callback(err)
    if (!git) return callback(null, null)

    // Could be a file acting as a "filesystem-agnostic git symbolic link" when
    // the working directory is a git submodule or --separate-git-dir was used
    fs.readFile(git, 'utf8', function (err, symlink) {
      if (err) {
        if (err.code === 'ENOENT') return callback(null, null)
        if (err.code === 'EISDIR') return callback(null, git)

        return callback(err)
      }

      callback(null, resolveSymlink(git, symlink))
    })
  }
}

module.exports.sync = function (cwd, roam) {
  cwd = cwd || '.'

  let git
  let symlink

  if (roam) {
    git = find.sync('.git', cwd)
  } else {
    git = path.resolve(cwd, '.git')
  }

  if (!git) {
    return null
  }

  try {
    symlink = fs.readFileSync(git, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') return null
    if (err.code === 'EISDIR') return git

    throw err
  }

  return resolveSymlink(git, symlink)
}

function resolveSymlink (git, symlink) {
  // For example "gitdir: ../.git/modules/beep"
  const match = /^gitdir:\s*([^\s]+)$/im.exec(symlink)

  if (match !== null) {
    return path.resolve(git, '..', match[1])
  } else {
    return null
  }
}
