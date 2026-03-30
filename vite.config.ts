import { defineConfig } from 'vite-plus'
import { defineLintConfig, defineFmtConfig } from '@kazupon/vp-config'

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
  lint: defineLintConfig(),
  fmt: defineFmtConfig()
})
