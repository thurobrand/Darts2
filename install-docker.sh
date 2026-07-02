#!/usr/bin/env bash

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root (sudo ./install-docker.sh)."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This installer currently supports Debian/Raspberry Pi OS (apt-get)."
  exit 1
fi

if command -v docker >/dev/null 2>&1; then
  echo "Docker is already installed: $(docker --version)"
else
  echo "Installing Docker using the official convenience script..."
  curl -fsSL https://get.docker.com | sh
fi

if ! getent group docker >/dev/null 2>&1; then
  groupadd docker
fi

TARGET_USER="${SUDO_USER:-}"
if [[ -n "$TARGET_USER" ]]; then
  usermod -aG docker "$TARGET_USER"
  echo "Added user '$TARGET_USER' to docker group."
fi

echo "Docker installation complete."
echo "Run 'newgrp docker' or log out and log back in to apply group membership changes."
echo "Verify with: docker run --rm hello-world"
