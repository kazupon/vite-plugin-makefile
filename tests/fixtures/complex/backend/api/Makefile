.PHONY: serve build test migrate seed lint generate-docs

serve: build
	@echo "starting API server"

build:
	@echo "building API"

test: build
	@echo "testing API"

migrate:
	@echo "running migrations"

seed: migrate
	@echo "seeding database"

lint:
	@echo "linting API code"

generate-docs: build
	@echo "generating API documentation"
