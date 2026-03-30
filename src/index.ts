/**
 * vite plugin for Makefile integration
 *
 * @module default
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { createDebug } from 'obug'
import { parseMakefileTasks } from './transformer.ts'

import type { MakefileOptions } from './types.ts'

const debug = createDebug('vite-plugin-makefile')

export type { MakefileOptions, TaskDefinition, ParsedTarget } from './types.ts'

/**
 * Vite plugin that generates tasks based on Makefiles found in the project
 *
 * @param options Makefile parsing and task generation options
 * @returns a Vite plugin object that generates tasks based on Makefiles in the project
 */
export function Makefile(options?: MakefileOptions) {
  const resolvedOptions = resolveOptions(options ?? {})
  debug('resolved options: %O', resolvedOptions)

  return {
    name: 'vite-plugin-makefile',

    config(_config: unknown, _env: unknown & { root: string }) {
      const root = _env.root ?? process.cwd()
      debug('config hook called, root: %s', root)
      const tasks = parseMakefileTasks(root, resolvedOptions)
      debug('generated %d tasks: %O', Object.keys(tasks).length, Object.keys(tasks))

      return {
        run: {
          tasks
        }
      }
    }
  }
}

function resolveOptions(options: MakefileOptions): Required<MakefileOptions> {
  return {
    include: options.include ?? ['.'],
    exclude: options.exclude ?? [],
    prefix: options.prefix ?? 'directory',
    cache: options.cache ?? true
  }
}
