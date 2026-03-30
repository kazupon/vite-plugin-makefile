#!/bin/bash

set -e

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json pnpm-lock.yaml

# Release packages
TAG="latest"
echo "⚡ Publishing $PKG with tag $TAG for npm registry"
pnpm publish --access public --no-git-checks --tag $TAG
