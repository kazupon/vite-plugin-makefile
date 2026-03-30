import { bench, describe } from 'vite-plus/test'
import { getPhonyTargets } from '../src/parser.ts'

const simpleMakefile = `\
.PHONY: build test clean setup

build: setup
\tgcc -o app src/*.c

test: build
\t./run_tests

clean:
\trm -rf dist

setup:
\t./bootstrap.sh
`

const largeMakefile = Array.from(
  { length: 50 },
  (_, i) => `\
.PHONY: task${i}

task${i}:${i > 0 ? ` task${i - 1}` : ''}
\techo "running task${i}"
`
).join('\n')

describe('getPhonyTargets', () => {
  bench('simple Makefile (4 targets)', () => {
    getPhonyTargets(simpleMakefile)
  })

  bench('large Makefile (50 targets)', () => {
    getPhonyTargets(largeMakefile)
  })
})
