'use strict'

const test = require('tape')
const tempy = require('tempy')
const path = require('path')
const fs = require('fs')
const execFileSync = require('child_process').execFileSync
const gitdir = require('..')
const own = path.resolve(__dirname, '..', '.git')

test('no arguments', function (t) {
  t.plan(4)

  t.is(gitdir.sync(), own)
  gitdir().then(dir => t.is(dir, own))
  gitdir(function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, own)
  })
})

test('cwd', function (t) {
  t.plan(4)

  t.is(gitdir.sync(__dirname), null)
  gitdir(__dirname).then(dir => t.is(dir, null))
  gitdir(__dirname, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, null)
  })
})

test('cwd and roam', function (t) {
  t.plan(4)

  t.is(gitdir.sync(__dirname, true), own)
  gitdir(__dirname, true).then(dir => t.is(dir, own))
  gitdir(__dirname, true, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, own)
  })
})

test('when input is a gitdir', function (t) {
  t.plan(4)

  const expected = path.join(path.dirname(__dirname), '.git')

  t.is(gitdir.sync(expected), expected)
  gitdir(expected).then(actual => t.is(actual, expected))
  gitdir(expected, function (err, actual) {
    t.ifError(err, 'no error')
    t.is(actual, expected)
  })
})

test('when directory does not exist', function (t) {
  t.plan(16)

  t.is(gitdir.sync('./nope'), null)
  gitdir('./nope').then(dir => t.is(dir, null))
  gitdir('./nope', function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, null)
  })

  t.is(gitdir.sync('./nope', true), own)
  gitdir('./nope', true).then(dir => t.is(dir, own))
  gitdir('./nope', true, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, own)
  })

  const tmp = tempy.directory()

  t.is(gitdir.sync(tmp), null)
  gitdir(tmp).then(dir => t.is(dir, null))
  gitdir(tmp, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, null)
  })

  t.is(gitdir.sync(tmp, true), null)
  gitdir(tmp, true).then(dir => t.is(dir, null))
  gitdir(tmp, true, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, null)
  })
})

test('absolute symlink', function (t) {
  t.plan(4)

  const tmp = tempy.directory()
  fs.writeFileSync(path.join(tmp, '.git'), 'gitdir: ' + own)

  t.is(gitdir.sync(tmp), own)
  gitdir(tmp).then(dir => t.is(dir, own))
  gitdir(tmp, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, own)
  })
})

test('relative symlink', function (t) {
  t.plan(4)

  const root = tempy.directory()
  const git = path.join(root, '.git')
  const sub = path.join(root, 'sub')

  fs.mkdirSync(git)
  fs.mkdirSync(sub)
  fs.writeFileSync(path.join(sub, '.git'), 'gitdir: ../.git')

  t.is(gitdir.sync(sub), git)
  gitdir(sub).then(dir => t.is(dir, git))
  gitdir(sub, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, git)
  })
})

test('empty symlink', function (t) {
  t.plan(4)

  const tmp = tempy.directory()
  fs.writeFileSync(path.join(tmp, '.git'), 'gitdir: ')

  t.is(gitdir.sync(tmp), null)
  gitdir(tmp).then(dir => t.is(dir, null))
  gitdir(tmp, function (err, dir) {
    t.ifError(err, 'no error')
    t.is(dir, null)
  })
})

// TODO: also test git submodules in a linked worktree
test('linked worktree', function (t) {
  t.plan(4 * 2)

  const mainWorkTree = tempy.directory()
  const linkedWorkTree = tempy.directory()
  const linkedWorkTreeName = path.basename(linkedWorkTree)

  createRepository(mainWorkTree)
  execFileSync('git', ['worktree', 'add', '-d', linkedWorkTree], { cwd: mainWorkTree })

  t.is(gitdir.sync(mainWorkTree), path.join(mainWorkTree, '.git'), 'main')
  t.is(gitdir.sync(mainWorkTree, { common: true }), path.join(mainWorkTree, '.git'), 'main (2)')
  t.is(gitdir.sync(linkedWorkTree), path.join(mainWorkTree, '.git', 'worktrees', linkedWorkTreeName), 'linked')
  t.is(gitdir.sync(linkedWorkTree, { common: true }), path.join(mainWorkTree, '.git'), 'common')

  gitdir(mainWorkTree).then(result => { t.is(result, path.join(mainWorkTree, '.git'), 'main') })
  gitdir(mainWorkTree, { common: true }).then(result => { t.is(result, path.join(mainWorkTree, '.git'), 'main (2)') })
  gitdir(linkedWorkTree).then(result => { t.is(result, path.join(mainWorkTree, '.git', 'worktrees', linkedWorkTreeName), 'linked') })
  gitdir(linkedWorkTree, { common: true }).then(result => { t.is(result, path.join(mainWorkTree, '.git'), 'common') })
})

function createRepository (cwd) {
  fs.writeFileSync(path.join(cwd, 'README'), 'hello world')

  execFileSync('git', ['init', '.'], { cwd })
  execFileSync('git', ['add', 'README'], { cwd })
  execFileSync('git', ['commit', '-m', 'Initial'], { cwd })
}
