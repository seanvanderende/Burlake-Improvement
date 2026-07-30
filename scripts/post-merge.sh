#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Run schema migrations inside the lib/db workspace so that its pg dependency
# resolves correctly. Each migration script uses CREATE TABLE IF NOT EXISTS and
# is idempotent.
pnpm --filter @workspace/db run migrate
