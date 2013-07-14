#!/bin/bash

BASEDIR=$(dirname $0)
cd $BASEDIR

SLICK_SETTINGS=`pwd`
SLICK_SETTINGS="$SLICK_SETTINGS/devserver.cfg"

export SLICK_SETTINGS

vpy/bin/watchmedo auto-restart -R -d slickqaweb -d slickqawebtest -i '*.swp;*.pyc;' ./server.py
