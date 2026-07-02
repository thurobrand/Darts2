#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if ! command -v mvn >/dev/null 2>&1; then
  echo "Error: Maven (mvn) is not installed or not in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH."
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/pom.xml" ]]; then
  echo "Error: Could not find backend/pom.xml"
  exit 1
fi

if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
  echo "Error: Could not find frontend/package.json"
  exit 1
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo
  echo "Shutting down backend and frontend..."

  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi

  wait >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

echo "Starting backend (Spring Boot)..."
(
  cd "$BACKEND_DIR"
  mvn spring-boot:run 2>&1 | sed 's/^/[backend] /'
) &
BACKEND_PID=$!

echo "Starting frontend (Vite)..."
(
  cd "$FRONTEND_DIR"
  npm run dev 2>&1 | sed 's/^/[frontend] /'
) &
FRONTEND_PID=$!

echo ""
echo "Both services started:"
echo "- Backend:  http://localhost:8080"
echo "- Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."
echo ""

wait -n
