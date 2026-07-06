#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

COMPOSE_CMD=()

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v podman-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(podman-compose)
elif command -v podman >/dev/null 2>&1 && podman compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(podman compose)
else
  echo "Error: no compose provider found."
  echo "Install one of the following:"
  echo "- Docker Compose plugin (docker compose)"
  echo "- podman-compose"
  echo
  echo "Debian/Raspberry Pi OS examples:"
  echo "  sudo apt update"
  echo "  sudo apt install -y docker-compose-plugin"
  echo "  sudo apt install -y podman-compose"
  exit 1
fi

run_compose() {
  "${COMPOSE_CMD[@]}" "$@"
}

wait_for_backend() {
  local ready_url="http://localhost:8080/health"
  local attempt=1
  local max_attempts=30

  while [[ $attempt -le $max_attempts ]]; do
    if curl -fsS "$ready_url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done

  return 1
}

echo "Using compose provider: ${COMPOSE_CMD[*]}"

if [[ -z "${FRONTEND_PORT:-}" ]]; then
  if [[ "${COMPOSE_CMD[0]}" == "podman-compose" || ("${COMPOSE_CMD[0]}" == "podman" && "${EUID}" -ne 0) ]]; then
    export FRONTEND_PORT=8080
    echo "FRONTEND_PORT not set; defaulting to ${FRONTEND_PORT} for rootless Podman."
  fi
fi

ACTION="${1:-up}"

case "$ACTION" in
  up)
    echo "Starting services with compose..."
    run_compose up -d --build
    if [[ "${COMPOSE_CMD[0]}" == "podman-compose" || "${COMPOSE_CMD[0]}" == "podman" ]]; then
      if ! podman ps --filter name=darts2-frontend --filter status=running --format '{{.Names}}' | grep -qx 'darts2-frontend'; then
        echo "Error: frontend container is not running."
        echo "Try: FRONTEND_PORT=8080 ./run-compose.sh up"
        echo "Check logs: ./run-compose.sh logs"
        exit 1
      fi
    fi
    if ! wait_for_backend; then
      echo "Error: backend did not become ready in time."
      echo "Check backend logs: ./run-compose.sh logs"
      exit 1
    fi
    echo "Frontend: http://localhost:${FRONTEND_PORT:-80}"
    ;;
  down)
    echo "Stopping services..."
    run_compose down
    ;;
  logs)
    run_compose logs -f
    ;;
  restart)
    run_compose down
    run_compose up -d --build
    wait_for_backend
    echo "Frontend: http://localhost:${FRONTEND_PORT:-80}"
    ;;
  *)
    echo "Usage: $0 [up|down|logs|restart]"
    exit 1
    ;;
esac
