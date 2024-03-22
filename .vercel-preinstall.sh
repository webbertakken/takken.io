#!/bin/sh

echo "Using corepack to select the correct version of Node and Yarn."

# Should already be installed in CI
if ! command -v corepack >/dev/null 2>&1; then
    echo "corepack is not installed. Installing..."
    npm install -g corepack
fi

# Allow corepack to select the correct version of Node and Yarn
corepack enable
corepack install
#corepack use yarn@4.1.1 # Must match package.json
#pwd
#ls
#yarn --version
#which yarn
#ls -alh "$(which yarn)"
#rm
