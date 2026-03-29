/**
 * vite plugin for Makefile integration
 *
 * @module default
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { parseMakefileTasks } from './transformer.ts'

import type { MakefileOptions } from './types.ts'

export type { MakefileOptions, TaskDefinition, ParsedTarget } from './types.ts'

/**
 * Vite plugin that generates tasks based on Makefiles found in the project
 *
 * @param options Makefile parsing and task generation options
 * @returns a Vite plugin object that generates tasks based on Makefiles in the project
 */
export function Makefile(options?: MakefileOptions) {
  const resolvedOptions = resolveOptions(options ?? {})
  return {
    name: 'vite-plugin-makefile',
    config(_config: unknown, _env: unknown & { root: string }) {
      const root = _env.root ?? process.cwd()
      return {
        run: {
          tasks: parseMakefileTasks(root, resolvedOptions)
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
