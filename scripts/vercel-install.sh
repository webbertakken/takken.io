#!/usr/bin/env bash
# Vercel install step. Vercel's Amazon Linux 2023 build image has no mise, and
# its documented package list does not include libatomic, which Node 26's
# official Linux binary links against; install it only when it is missing.
set -euo pipefail

if ldconfig -p | grep -q 'libatomic\.so\.1'; then
  echo 'vercel-install: libatomic.so.1 present'
else
  echo 'vercel-install: libatomic.so.1 missing, installing libatomic'
  dnf install -y libatomic
fi

./bin/mise install
./bin/mise exec -- node --version
./bin/mise exec -- yarn install --immutable
