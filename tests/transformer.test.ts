import { describe, it, expect } from 'vite-plus/test'
import { resolve } from 'node:path'
import { parseMakefileTasks } from '../src/transformer.ts'

const fixturesDir = resolve(__dirname, 'fixtures')

describe('parseMakefileTasks', () => {
  it('should generate tasks from a simple Makefile', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'simple'), {
      include: ['.'],
      exclude: [],
      prefix: 'directory',
      cache: true
    })

    expect(tasks.build).toEqual({
      command: 'make build',
      dependsOn: ['setup'],
      cache: true,
      input: ['Makefile']
    })

    expect(tasks.test).toEqual({
      command: 'make test',
      dependsOn: ['build'],
      cache: true,
      input: ['Makefile']
    })

    expect(tasks.clean).toEqual({
      command: 'make clean',
      cache: true,
      input: ['Makefile']
    })

    expect(tasks.setup).toEqual({
      command: 'make setup',
      cache: true,
      input: ['Makefile']
    })
  })

  it('should generate prefixed tasks from multiple directories', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'multi-dir'), {
      include: ['.', 'infra'],
      exclude: [],
      prefix: 'directory',
      cache: true
    })

    // Root tasks have no prefix
    expect(tasks.build).toBeDefined()
    expect(tasks.build.command).toBe('make build')

    // infra/ tasks have directory prefix
    expect(tasks['infra/docker-up']).toEqual({
      command: 'make docker-up',
      cwd: 'infra',
      cache: true,
      input: ['Makefile']
    })

    expect(tasks['infra/migrate']).toEqual({
      command: 'make migrate',
      cwd: 'infra',
      dependsOn: ['infra/docker-up'],
      cache: true,
      input: ['Makefile']
    })
  })

  it('should exclude specified targets', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'simple'), {
      include: ['.'],
      exclude: ['clean', 'setup'],
      prefix: 'directory',
      cache: true
    })

    expect(tasks.build).toBeDefined()
    expect(tasks.test).toBeDefined()
    expect(tasks.clean).toBeUndefined()
    expect(tasks.setup).toBeUndefined()
  })

  it('should support custom prefix function', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'multi-dir'), {
      include: ['.', 'infra'],
      exclude: [],
      prefix: (dir, target) => (dir === '.' ? target : `${dir}:${target}`),
      cache: true
    })

    expect(tasks['infra:docker-up']).toBeDefined()
  })

  it('should disable cache when cache option is false', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'simple'), {
      include: ['.'],
      exclude: [],
      prefix: 'directory',
      cache: false
    })

    expect(tasks.build.cache).toBe(false)
  })
})
