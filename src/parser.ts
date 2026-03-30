/**
 * Parser for Makefile content.
 *
 * @module parser
 */

/**
 * @author kazuya kawaguchi (a.k.a. kazupon)
 * @license MIT
 */

import { createDebug } from 'obug'
import { parseMakefile } from '../binding/index.js'

import type { ParsedTarget } from './types.ts'

const debug = createDebug('vite-plugin-makefile:parser')

/**
 * Parse the content of a Makefile and extract targets, their prerequisites, and phony status.
 *
 * @param content the content of a Makefile as a string
 * @returns an array of parsed targets with their prerequisites and phony status
 */
function parseMakefileTargets(content: string): ParsedTarget[] {
  const targets = parseMakefile(content)
  debug('parsed %d targets', targets.length)
  return targets
}

/**
 * Extract only the phony targets from the Makefile content.
 *
 * @param content the content of a Makefile as a string
 * @returns an array of targets that are marked as .PHONY in the Makefile
 */
export function getPhonyTargets(content: string): ParsedTarget[] {
  const phony = parseMakefileTargets(content).filter(target => target.isPhony)
  debug('filtered %d phony targets', phony.length)
  return phony
}
