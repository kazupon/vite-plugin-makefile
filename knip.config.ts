import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: ['vite.config.ts', 'tests/**/*.test.ts', '**/*.bench.ts', 'example-app/**'],
  ignoreDependencies: ['@kazupon/eslint-plugin', '@kazupon/vp-config', '@typescript/native-preview']
}

export default config
