#! /bin/bash

set -ex
shopt -s expand_aliases
if command -v docker &> /dev/null; then
  container_runtime="docker"
elif command -v podman &> /dev/null; then
  container_runtime="podman"
else
  echo install docker or podman
  exit 1
fi
alias podman="$container_runtime"

USERNAME=lausser
IMAGE=portfolio_exporter
podman build -t $USERNAME/$IMAGE:latest .
