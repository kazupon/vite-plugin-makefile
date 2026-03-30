import { bench, describe, beforeAll, beforeEach } from 'vite-plus/test'
import { resolve } from 'node:path'
import { parseMakefileTasks, clearMakefileCache } from '../src/transformer.ts'

const fixturesDir = resolve(__dirname, 'fixtures')

const complexIncludes = [
  '.',
  'backend/api',
  'backend/worker',
  'infra/docker',
  'infra/terraform',
  'frontend',
  'scripts'
]

const defaultOpts = {
  include: ['.'],
  exclude: [] as string[],
  prefix: 'directory' as const,
  cache: true
}

const complexOpts = {
  ...defaultOpts,
  include: complexIncludes
}

describe('parseMakefileTasks (cold)', () => {
  beforeEach(() => {
    clearMakefileCache()
  })

  bench('simple (1 dir, 4 targets)', () => {
    clearMakefileCache()
    parseMakefileTasks(resolve(fixturesDir, 'simple'), defaultOpts)
  })

  bench('complex (7 dirs, 51 targets)', () => {
    clearMakefileCache()
    parseMakefileTasks(resolve(fixturesDir, 'complex'), complexOpts)
  })
})

describe('parseMakefileTasks (cached)', () => {
  beforeAll(() => {
    // Warm up cache
    clearMakefileCache()
    parseMakefileTasks(resolve(fixturesDir, 'simple'), defaultOpts)
    parseMakefileTasks(resolve(fixturesDir, 'complex'), complexOpts)
  })

  bench('simple (1 dir, 4 targets)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'simple'), defaultOpts)
  })

  bench('complex (7 dirs, 51 targets)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'complex'), complexOpts)
  })
})
