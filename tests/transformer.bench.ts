import { bench, describe } from 'vite-plus/test'
import { resolve } from 'node:path'
import { parseMakefileTasks } from '../src/transformer.ts'

const fixturesDir = resolve(__dirname, 'fixtures')

describe('parseMakefileTasks', () => {
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

  bench('with custom prefix function', () => {
    parseMakefileTasks(resolve(fixturesDir, 'multi-dir'), {
      include: ['.', 'infra'],
      exclude: [],
      prefix: (dir, target) => (dir === '.' ? target : `${dir}:${target}`),
      cache: true
    })
  })
})
