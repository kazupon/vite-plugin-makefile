import { bench, describe } from 'vite-plus/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseMakefileTasks } from '../src/transformer.ts'
import { transformMakefileTasksNative } from '../binding/index.js'

const fixturesDir = resolve(__dirname, 'fixtures')

// Pre-read file contents for Rust-side benchmarks (to isolate parse+transform from I/O)
const simpleContent = readFileSync(resolve(fixturesDir, 'simple/Makefile'), 'utf-8')
const multiDirRootContent = readFileSync(resolve(fixturesDir, 'multi-dir/Makefile'), 'utf-8')
const multiDirInfraContent = readFileSync(resolve(fixturesDir, 'multi-dir/infra/Makefile'), 'utf-8')

describe('parseMakefileTasks (TypeScript)', () => {
  bench('simple Makefile (single directory)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'simple'), {
      include: ['.'],
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('multi-dir Makefile (2 directories)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'multi-dir'), {
      include: ['.', 'infra'],
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('with exclude filter', () => {
    parseMakefileTasks(resolve(fixturesDir, 'simple'), {
      include: ['.'],
      exclude: ['clean', 'setup'],
      prefix: 'directory',
      cache: true
    })
  })
})

describe('transformMakefileTasksNative (Rust)', () => {
  bench('simple Makefile (single directory)', () => {
    transformMakefileTasksNative(simpleContent, {
      dir: '.',
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('multi-dir Makefile (2 directories)', () => {
    transformMakefileTasksNative(multiDirRootContent, {
      dir: '.',
      exclude: [],
      prefix: 'directory',
      cache: true
    })
    transformMakefileTasksNative(multiDirInfraContent, {
      dir: 'infra',
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('with exclude filter', () => {
    transformMakefileTasksNative(simpleContent, {
      dir: '.',
      exclude: ['clean', 'setup'],
      prefix: 'directory',
      cache: true
    })
  })
})
