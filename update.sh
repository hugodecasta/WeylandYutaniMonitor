#!/bin/sh

cd /home/hugo/WeylandYutaniMonitor || exit

sudo service weylandio stop || echo "cannot stop service ..."

git reset --hard
git pull || echo "oops pull"

npm install || echo "cannot install"

sudo service weylandio restart || echo "cannot restart"
