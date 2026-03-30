import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: ['vite.config.ts', 'tests/**/*.test.ts', 'example-app/**'],
  ignoreDependencies: ['@kazupon/eslint-plugin', '@kazupon/vp-config', '@typescript/native-preview']
}

export default config
