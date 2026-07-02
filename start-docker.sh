#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed. Run ./install-docker.sh first."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose plugin is not available."
  exit 1
fi

echo "Building and starting backend + frontend containers..."
docker compose up -d --build

echo
echo "Services are starting:"
echo "- Frontend: http://localhost"
echo "- API (proxied): http://localhost/api"
echo
echo "Useful commands:"
echo "- View logs: docker compose logs -f"
echo "- Stop:      docker compose down"
