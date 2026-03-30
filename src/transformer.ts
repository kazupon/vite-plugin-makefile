/**
 * Transformt makefile-lossless `MakefileTarget` structure to `TaskDefinition` for Vite's run command.
 *
 * @module transformer
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { createDebug } from 'obug'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPhonyTargets } from './parser.ts'

import type { MakefileCacheEntry, MakefileOptions, ParsedTarget, TaskDefinition } from './types.ts'

const debug = createDebug('vite-plugin-makefile:transformer')

const fileCache = new Map<string, MakefileCacheEntry>()

function getCachedTargets(makefilePath: string): ParsedTarget[] {
  const stat = statSync(makefilePath)
  const cached = fileCache.get(makefilePath)

  // Level 1: mtime check (no file read needed)
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    debug('cache hit (mtime): %s', makefilePath)
    return cached.targets
  }

  // mtime changed or no cache entry -- must read the file
  const content = readFileSync(makefilePath, 'utf-8')
  const contentHash = createHash('sha1').update(content).digest('hex')

  // Level 2: content hash check (avoids re-parsing)
  if (cached && cached.contentHash === contentHash) {
    debug('cache hit (content hash): %s', makefilePath)
    cached.mtimeMs = stat.mtimeMs
    return cached.targets
  }

  // Cache miss -- parse
  debug('cache miss: %s', makefilePath)
  const targets = getPhonyTargets(content)
  fileCache.set(makefilePath, { mtimeMs: stat.mtimeMs, contentHash, targets })
  return targets
}

/**
 * Clear the internal Makefile parse cache.
 */
export function clearMakefileCache(): void {
  fileCache.clear()
  debug('cache cleared')
}

/**
 * Parse Makefiles in the specified directories and transform their targets into Vite task definitions.
 *
 * @param root the root directory of the project (usually Vite's workspace root)
 * @param options options for Makefile parsing and task generation, including which directories to scan, target exclusions, naming strategy, and caching
 * @returns a record of task definitions keyed by their resolved task names, ready to be used in Vite's run command
 */
export function parseMakefileTasks(
  root: string,
  options: Required<MakefileOptions>
): Record<string, TaskDefinition> {
  const { include, exclude, prefix, cache } = options

  const tasks: Record<string, TaskDefinition> = {}

  for (const dir of include) {
    const makefilePath = resolve(root, dir, 'Makefile')
    if (!existsSync(makefilePath)) {
      debug('Makefile not found: %s', makefilePath)
      continue
    }

    const targets = getCachedTargets(makefilePath)
    debug(
      'found %d phony targets in %s: %O',
      targets.length,
      dir,
      targets.map(t => t.name)
    )
    const phonyNames = new Set(targets.map(t => t.name))
    const isRoot = dir === '.'

    for (const target of targets) {
      if (exclude.includes(target.name)) {
        debug('excluding target: %s', target.name)
        continue
      }

      const taskName = resolveTaskName(dir, target.name, prefix, isRoot)
      const phonyDeps = target.prerequisites.filter(p => phonyNames.has(p))
      const dependsOn = phonyDeps.map(dep => resolveTaskName(dir, dep, prefix, isRoot))

      const task: TaskDefinition = {
        command: `make ${target.name}`,
        cache,
        input: ['Makefile']
      }

      if (!isRoot) {
        task.cwd = dir
      }

      if (dependsOn.length > 0) {
        task.dependsOn = dependsOn
      }

      if (tasks[taskName]) {
        throw new Error(
          `[vite-plugin-makefile] Task name conflict: "${taskName}" is defined in multiple Makefiles. Use the "prefix" option to resolve.`
        )
      }

      debug('task registered: %s -> %O', taskName, task)
      tasks[taskName] = task
    }
  }

  return tasks
}

function resolveTaskName(
  dir: string,
  target: string,
  prefix: MakefileOptions['prefix'],
  isRoot: boolean
): string {
  if (typeof prefix === 'function') {
    return prefix(dir, target)
  }

  if (prefix === 'none' || isRoot) {
    return target
  }

  return `${dir}/${target}`
}
