import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: ['vite.config.ts'],
  ignoreDependencies: ['@kazupon/eslint-plugin', '@kazupon/vp-config', '@typescript/native-preview']
}

export default config
