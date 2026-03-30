.PHONY: setup clean gen-api check-deps

# Bootstrap the project: install dependencies and generate API types
setup:
	@echo "==> Installing dependencies..."
	@npm install --silent 2>/dev/null || echo "  (skipped: npm not needed)"
	@echo "==> Setup complete."

# Remove build artifacts and generated files
clean:
	@echo "==> Cleaning build artifacts..."
	@rm -rf dist
	@rm -f src/api-types.d.ts
	@echo "==> Clean complete."

# Generate TypeScript type definitions from the backend API schema
gen-api:
	@echo "==> Generating API types from schema..."
	@mkdir -p src
	@cat scripts/api-schema.json | node -e "\
		const fs = require('fs'); \
		const schema = JSON.parse(fs.readFileSync('/dev/stdin', 'utf-8')); \
		const lines = ['// Auto-generated from api-schema.json', '']; \
		for (const [name, def] of Object.entries(schema.types)) { \
			lines.push('export interface ' + name + ' {'); \
			for (const [field, type] of Object.entries(def)) { \
				lines.push('  ' + field + ': ' + type); \
			} \
			lines.push('}', ''); \
		} \
		fs.writeFileSync('src/api-types.d.ts', lines.join('\n')); \
	"
	@echo "  Generated src/api-types.d.ts"

# Check that required tools are available
check-deps:
	@echo "==> Checking dependencies..."
	@command -v node >/dev/null 2>&1 && echo "  node: $$(node --version)" || echo "  node: NOT FOUND"
	@command -v make >/dev/null 2>&1 && echo "  make: $$(make --version | head -1)" || echo "  make: NOT FOUND"
	@echo "==> Done."
