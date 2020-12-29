#!/bin/bash

cd ..
DIR=`pwd`
cd 
git clone https://gitlab.mediforprogram.com/medifor/analytic-worker
cd ./analytic-worker
git checkout --track origin/feature/tagprefixfilter
cat ./proto/pipeline.proto > $DIR/server/proto/pipeline.proto
cat ./proto/task.proto > $DIR/server/proto/task.proto
sudo rm -R ~/analytic-worker
echo done



