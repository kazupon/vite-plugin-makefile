import { describe, it, expect } from 'vite-plus/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseMakefile } from '../binding/index.js'
import { getPhonyTargets } from '../src/parser.ts'

const fixturesDir = resolve(__dirname, 'fixtures')

describe('parseMakefile', () => {
  it('should parse all targets from a simple Makefile', () => {
    const content = readFileSync(resolve(fixturesDir, 'simple/Makefile'), 'utf-8')
    const targets = parseMakefile(content)

    expect(targets.length).toBeGreaterThan(0)
    const names = targets.map(t => t.name)
    expect(names).toContain('build')
    expect(names).toContain('test')
    expect(names).toContain('clean')
    expect(names).toContain('setup')
  })

  it('should identify phony targets', () => {
    const content = readFileSync(resolve(fixturesDir, 'simple/Makefile'), 'utf-8')
    const targets = parseMakefile(content)

    const build = targets.find(t => t.name === 'build')
    expect(build?.isPhony).toBe(true)
  })

  it('should extract prerequisites', () => {
    const content = readFileSync(resolve(fixturesDir, 'simple/Makefile'), 'utf-8')
    const targets = parseMakefile(content)

    const build = targets.find(t => t.name === 'build')
    expect(build?.prerequisites).toContain('setup')

    const test = targets.find(t => t.name === 'test')
    expect(test?.prerequisites).toContain('build')
  })
})

describe('getPhonyTargets', () => {
  it('should return only phony targets', () => {
    const content = readFileSync(resolve(fixturesDir, 'simple/Makefile'), 'utf-8')
    const phony = getPhonyTargets(content)

    expect(phony.every(t => t.isPhony)).toBe(true)
    expect(phony.map(t => t.name)).toEqual(
      expect.arrayContaining(['build', 'test', 'clean', 'setup'])
    )
  })
})
