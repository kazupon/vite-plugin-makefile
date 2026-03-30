import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkgPath = resolve(import.meta.dirname, '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const { version, optionalDependencies } = pkg

if (!optionalDependencies) {
  process.exit(0)
}

let updated = false
for (const name of Object.keys(optionalDependencies)) {
  if (optionalDependencies[name] !== version) {
    optionalDependencies[name] = version
    updated = true
  }
}

if (updated) {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`synced optionalDependencies to ${version}`)
}
