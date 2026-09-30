#!/bin/sh

set -e

echo "================================="
echo "Starting Rayen Assurance"
echo "================================="

echo "Applying database migrations..."

./node_modules/.bin/prisma migrate deploy

echo "Starting application..."

exec node dist/src/server.js