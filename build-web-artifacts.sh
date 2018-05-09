#!/bin/bash

BASEDIR=$(dirname $0)
cd $BASEDIR

./vpy/bin/python slickqaweb/compiledResources.py
