import { defineConfig } from 'vite-plus'
import { Makefile } from '../src/index.ts'

export default defineConfig({
  plugins: [
    Makefile({
      include: ['.', 'infra'],
      exclude: [],
      prefix: 'directory'
    })
  ],
  run: {
    tasks: {}
  },
  lint: { options: { typeAware: true, typeCheck: true } }
})
