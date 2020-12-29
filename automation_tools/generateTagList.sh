#!/bin/bash
cd $1
rm files.txt
ls $PWD/* -I files.txt | sed "s/$/|/" | tee files.txt # sed "s/$/|test tag, test-tag,tag/"