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

  it('should handle complex nested directory structure', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'complex'), {
      include: [
        '.',
        'backend/api',
        'backend/worker',
        'infra/docker',
        'infra/terraform',
        'frontend',
        'scripts'
      ],
      exclude: [],
      prefix: 'directory',
      cache: true
    })

    // Root targets (8)
    expect(tasks.all).toBeDefined()
    expect(tasks.build).toBeDefined()
    expect(tasks.ci).toBeDefined()
    expect(tasks.all.dependsOn).toEqual(expect.arrayContaining(['build', 'test', 'lint']))

    // backend/api targets (7)
    expect(tasks['backend/api/serve']).toBeDefined()
    expect(tasks['backend/api/serve'].cwd).toBe('backend/api')
    expect(tasks['backend/api/serve'].dependsOn).toEqual(['backend/api/build'])
    expect(tasks['backend/api/seed'].dependsOn).toEqual(['backend/api/migrate'])

    // backend/worker targets (6)
    expect(tasks['backend/worker/start']).toBeDefined()
    expect(tasks['backend/worker/deploy'].dependsOn).toEqual(['backend/worker/test'])

    // infra/docker targets (7)
    expect(tasks['infra/docker/up']).toBeDefined()
    expect(tasks['infra/docker/restart'].dependsOn).toEqual(
      expect.arrayContaining(['infra/docker/down', 'infra/docker/up'])
    )

    // infra/terraform targets (8)
    expect(tasks['infra/terraform/plan']).toBeDefined()
    expect(tasks['infra/terraform/apply'].dependsOn).toEqual(['infra/terraform/plan'])
    expect(tasks['infra/terraform/plan'].dependsOn).toEqual(['infra/terraform/init'])

    // frontend targets (9)
    expect(tasks['frontend/dev']).toBeDefined()
    expect(tasks['frontend/analyze'].dependsOn).toEqual(['frontend/bundle'])
    expect(tasks['frontend/e2e'].dependsOn).toEqual(['frontend/build'])

    // scripts targets (6)
    expect(tasks['scripts/gen-types'].dependsOn).toEqual(['scripts/gen-api'])
    expect(tasks['scripts/gen-mocks'].dependsOn).toEqual(['scripts/gen-types'])

    // Total: 8 + 7 + 6 + 7 + 8 + 9 + 6 = 51
    expect(Object.keys(tasks).length).toBe(51)
  })

  it('should handle complex structure with exclude', () => {
    const tasks = parseMakefileTasks(resolve(fixturesDir, 'complex'), {
      include: ['.', 'backend/api', 'infra/docker'],
      exclude: ['clean', 'lint', 'prune', 'logs', 'ps'],
      prefix: 'directory',
      cache: true
    })

    expect(tasks.clean).toBeUndefined()
    expect(tasks.lint).toBeUndefined()
    expect(tasks['infra/docker/prune']).toBeUndefined()
    expect(tasks['infra/docker/logs']).toBeUndefined()
    expect(tasks['infra/docker/ps']).toBeUndefined()

    expect(tasks.build).toBeDefined()
    expect(tasks['backend/api/serve']).toBeDefined()
    expect(tasks['infra/docker/up']).toBeDefined()
  })
})
