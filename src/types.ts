/**
 * Type definitions for Vite Makefile Plugin
 *
 * @module types
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

/**
 * Options for vite-plugin-makefile
 */
export interface MakefileOptions {
  /**
   * List of directories to scan for Makefiles (relative to workspace root).
   *
   * @default ['.']
   */
  include?: string[]

  /**
   * Target names to exclude from task generation.
   */
  exclude?: string[]

  /**
   * Task name prefix strategy.
   *
   * - `'directory'`: Use directory name as prefix (e.g. `infra/docker-up`)
   * - `'none'`: No prefix (throws on name conflicts)
   * - Function: `(dir, target) => taskName` for custom naming
   *
   * @default 'directory'
   */
  prefix?: 'directory' | 'none' | ((dir: string, target: string) => string)

  /**
   * Enable caching for all generated tasks.
   *
   * @default true
   */
  cache?: boolean
}

/**
 * Definition of a task generated from a Makefile target
 */
export interface TaskDefinition {
  command: string
  cwd?: string
  dependsOn?: string[]
  cache?: boolean
  input?: string[]
}

/**
 * Parsed representation of a Makefile target, including its name, prerequisites, and whether it's phony
 */
export interface ParsedTarget {
  name: string
  prerequisites: string[]
  isPhony: boolean
}

/**
 * Cache entry for a parsed Makefile, keyed by absolute file path
 */
export interface MakefileCacheEntry {
  /** File modification time in milliseconds */
  mtimeMs: number
  /** Hash of file content for change detection when mtime changes */
  contentHash: string
  /** Cached phony targets from parsing */
  targets: ParsedTarget[]
}
