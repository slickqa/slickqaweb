#!/bin/bash

BASEDIR=$(dirname $0)
cd $BASEDIR

BASEDIR=`pwd`

SLICK_SETTINGS=`pwd`
SLICK_SETTINGS="$SLICK_SETTINGS/devserver.cfg"

export SLICK_SETTINGS
echo "Checking for Updates to requirements..."
vpy/bin/pip -q install --upgrade -r requirements.txt

echo "Running slick development server (autorestart on file change)..."
#vpy/bin/watchmedo auto-restart -R -d slickqaweb -d slickqawebtest -i '*.swp;*.pyc;catalog' $BASEDIR/vpy/bin/python $BASEDIR/server.py
vpy/bin/python ./server.py
