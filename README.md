# vite-plugin-makefile

[![npm][npm-src]][npm-href]
[![CI][ci-src]][ci-href]

Vite plugin that converts Makefile targets into [vite-plus](https://github.com/nicolo-ribaudo/vite-plus) tasks

## ✨ Features

- ✅️ Automatically discovers `.PHONY` targets from Makefiles
- ✅️ Converts prerequisites into `dependsOn` task dependencies
- ✅️ Supports multiple directories with prefix strategies
- ✅️ Powered by [makefile-lossless](https://crates.io/crates/makefile-lossless) via NAPI-RS binding

## 💿 Installation

```sh
vp add -D vite-plugin-makefile
```

## 🚀 Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite-plus'
import { Makefile } from 'vite-plugin-makefile'

export default defineConfig({
  plugins: [
    Makefile({
      include: ['.', 'infra'],
      exclude: ['help', 'default'],
      prefix: 'directory'
    })
  ],
  run: {
    tasks: {
      // Merged with plugin-generated tasks
      lint: { command: 'vp lint' }
    }
  }
})
```

Given the following project structure:

```sh
project/
├── Makefile          # .PHONY: build test clean setup
├── infra/
│   └── Makefile      # .PHONY: docker-up docker-down migrate
└── vite.config.ts
```

The plugin generates the following tasks:

```json
{
  "build": { "command": "make build", "dependsOn": ["setup"] },
  "test": { "command": "make test", "dependsOn": ["build"] },
  "clean": { "command": "make clean" },
  "setup": { "command": "make setup" },
  "infra/docker-up": { "command": "make docker-up", "cwd": "infra" },
  "infra/docker-down": { "command": "make docker-down", "cwd": "infra" },
  "infra/migrate": { "command": "make migrate", "cwd": "infra", "dependsOn": ["infra/docker-up"] }
}
```

## ⚙️ Options

### `include`

- Type: `string[]`
- Default: `['.']`

List of directories to scan for Makefiles (relative to workspace root).

### `exclude`

- Type: `string[]`
- Default: `[]`

Target names to exclude from task generation.

### `prefix`

- Type: `'directory' | 'none' | ((dir: string, target: string) => string)`
- Default: `'directory'`

Task name prefix strategy.

- `'directory'`: Use directory name as prefix (e.g. `infra/docker-up`)
- `'none'`: No prefix (throws on name conflicts)
- Function: `(dir, target) => taskName` for custom naming

### `cache`

- Type: `boolean`
- Default: `true`

Enable caching for all generated tasks.

## 🚧 Limitations

- Only `.PHONY` targets are converted to tasks
- Variable expansion (`$(VAR)`) is not supported
- Pattern rules (`%.o: %.c`) are not supported
- Implicit rules are not supported
- Recursive Make (`$(MAKE) -C subdir`) is not supported — use the `include` option instead
- Conditional targets (`ifeq` / `ifdef`) are not supported

## ©️ License

[MIT](http://opensource.org/licenses/MIT)

<!-- Badges -->

[npm-src]: https://img.shields.io/npm/v/vite-plugin-makefile?style=flat
[npm-href]: https://npmjs.com/package/vite-plugin-makefile
[ci-src]: https://github.com/kazupon/vite-plugin-makefile/actions/workflows/ci.yml/badge.svg
[ci-href]: https://github.com/kazupon/vite-plugin-makefile/actions/workflows/ci.yml
