#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

UI_BRANCH=develop
NAME=medifor-ui:latest
CACHE_SOURCE=gitlab-registry.mediforprogram.com/medifor/medifor-demo-ui:latest

usage="$(basename "$0") [-h|--help] [-b|--branch $UI_BRANCH] [-n|--name $NAME] -- program to build  docker image

where:
    -h  show this help text
    -b|--branch set the git branch (default: $UI_BRANCH)
    -n|--name sets name and optionally a tag in the ‘name:tag’ format (default: $NAME)"


POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -b|--branch)
    UI_BRANCH="$2"
    shift # past argument
    shift # past value
    ;;
    -n|--name)
    NAME="$2"
    shift # past argument
    shift # past value
    ;;
    -h|--help)
    echo "$usage" >&2
    exit 1
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters


#Get version from package json
commit=$(git rev-parse origin/$UI_BRANCH)
commit_epoch_date=$(git log -n 1 --pretty=format:"%at" origin/$UI_BRANCH)



if [[ "$(uname)" = "Darwin" ]]; then
    commit_date_utc=$(date -ur $commit_epoch_date +"%Y-%m-%d %H:%M:%SZ")
else
    commit_date_utc=$(date -u --date=@$commit_epoch_date +"%Y-%m-%d %H:%M:%SZ")
fi
build_date_utc=$(date -u +"%Y-%m-%d %H:%M:%SZ")
cd server
version=$(npm list --depth=0 medifor-demo | grep medifor-demo | cut -d' ' -f1 | cut -d'@' -f2)
cd -

echo "Building Branch: $UI_BRANCH"
echo "Building Image: $NAME"
echo "Commit: $commit"
echo "Commit epoch: $commit_epoch_date"
echo "Commit Date: $commit_date_utc"
echo "Build Date: $build_date_utc"
echo "Version: $version"
docker build --cache-from $CACHE_SOURCE --rm -t $NAME \
--build-arg BRANCH=${UI_BRANCH} \
--build-arg COMMIT=${commit} \
--build-arg COMMIT_DATE="${commit_date_utc}" \
--build-arg BUILD_DATE="${build_date_utc}" \
--build-arg VERSION=${version} .