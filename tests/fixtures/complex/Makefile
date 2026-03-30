.PHONY: all build test clean setup lint check ci

all: build test lint
	@echo "all done"

build: setup
	@echo "building project"

test: build
	@echo "running tests"

clean:
	@rm -rf dist

setup:
	@echo "setting up"

lint:
	@echo "linting"

check: lint test
	@echo "checking"

ci: check build
	@echo "running ci"
