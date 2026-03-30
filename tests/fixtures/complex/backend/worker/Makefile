.PHONY: start stop build test health-check deploy

start: build
	@echo "starting worker"

stop:
	@echo "stopping worker"

build:
	@echo "building worker"

test: build
	@echo "testing worker"

health-check: start
	@echo "checking worker health"

deploy: test
	@echo "deploying worker"
