#!/bin/sh

# This is only needed for CI systems to respect yarn version in package.json and can be removed
# later. In github CI it's already handled by the workflow. Vercel however needs this script.

echo "Running in CI. Using corepack to select the correct version of Node and Yarn."

# Should already be installed in CI
if ! command -v corepack >/dev/null 2>&1; then
    echo "corepack is not installed. Installing..."
    npm install -g corepack
fi

# Allow corepack to select the correct version of Node and Yarn
corepack enable
corepack install
