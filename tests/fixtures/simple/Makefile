.PHONY: build test clean setup

build: setup
	gcc -o app src/*.c

test: build
	./run_tests

clean:
	rm -rf dist

setup:
	./bootstrap.sh
