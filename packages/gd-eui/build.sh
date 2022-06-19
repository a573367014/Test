#!/bin/bash
yarn build

yarn publish-gd

num=$1

dir=""

for i in `seq 2 $num`
do
    dir="$dir../"
done

cd $dir


yarn docs:build

yarn deploy