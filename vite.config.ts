import { defineConfig } from 'vite-plus'
import {
  defineLintConfig,
  defineFmtConfig,
  defaultIgnoreFilesOfEnforceHeaderCommentRule
} from '@kazupon/vp-config'

export default defineConfig({
  staged: {
    '*': 'vp check --fix'
  },
  pack: {
    dts: {
      tsgo: true
    },
    exports: true,
    deps: {
      alwaysBundle: [],
      neverBundle: [/binding\/index\.js/, /\.node$/]
    }
  },
  // @ts-expect-error -- FIXME: Fix the type definition of `defineLintConfig`
  lint: defineLintConfig({
    comments: {
      enForceHeaderComment: {
        ignoreFiles: [
          ...defaultIgnoreFilesOfEnforceHeaderCommentRule,
          'example-app/**',
          'scripts/**',
          '**/*.bench.ts'
        ]
      }
    }
  }),
  fmt: defineFmtConfig({
    ignorePatterns: ['CHANGELOG.md']
  })
})
