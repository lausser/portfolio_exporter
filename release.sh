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
alias docker="$container_runtime"

USERNAME=lausser
IMAGE=portfolio_exporter
grep -q remote .git/config && git pull
# bump version
# labeldisable, weil Fedora so ein Dreck ist. Und Podman auch. Und SELinux erst recht.
docker run --security-opt label=disable --rm -v "$PWD":/app treeder/bump patch
version=`cat VERSION`
echo "version: $version"
pwversion=`awk -F: '$1 ~ /^FROM/ { print $2}' < Dockerfile`
version="${pwversion}-${version}"

# run build
./build.sh

# tag it
##git add -A # dont add everything without an explicit approval
##git commit -m "version $version"
test -d .git && git commit -a -m "version $version"
test -d .git && git tag -a "$version" -m "version $version"
grep -q remote .git/config && git push
grep -q remote .git/config && git push --tags
docker tag $USERNAME/$IMAGE:latest $USERNAME/$IMAGE:$version
docker tag $USERNAME/$IMAGE:latest ghcr.io/$USERNAME/$IMAGE:latest
docker tag $USERNAME/$IMAGE:latest ghcr.io/$USERNAME/$IMAGE:$version

# push it
docker push $USERNAME/$IMAGE:latest
docker push $USERNAME/$IMAGE:$version
docker push ghcr.io/$USERNAME/$IMAGE:latest
docker push ghcr.io/$USERNAME/$IMAGE:$version
