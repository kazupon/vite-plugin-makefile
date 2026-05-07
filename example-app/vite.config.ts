import { defineConfig, lazyPlugins } from 'vite-plus'
import { Makefile } from '../src/index.ts'

console.log('Vite configuration loaded')
export default defineConfig({
  plugins: [
    lazyPlugins(() => {
      return [
        Makefile({
          include: ['.', 'infra'],
          exclude: [],
          prefix: 'directory'
        })
      ]
    })
  ],
  run: {
    tasks: {}
  },
  lint: { options: { typeAware: true, typeCheck: true } }
})
