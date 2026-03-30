import { bench, describe } from 'vite-plus/test'
import { resolve } from 'node:path'
import { parseMakefileTasks } from '../src/transformer.ts'

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

describe('parseMakefileTasks', () => {
  bench('simple (1 dir, 4 targets)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'simple'), {
      include: ['.'],
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('multi-dir (2 dirs, 7 targets)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'multi-dir'), {
      include: ['.', 'infra'],
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('complex (7 dirs, 51 targets)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'complex'), {
      include: complexIncludes,
      exclude: [],
      prefix: 'directory',
      cache: true
    })
  })

  bench('complex with exclude (7 dirs)', () => {
    parseMakefileTasks(resolve(fixturesDir, 'complex'), {
      include: complexIncludes,
      exclude: ['clean', 'lint', 'format', 'prune', 'logs', 'ps'],
      prefix: 'directory',
      cache: true
    })
  })
})
