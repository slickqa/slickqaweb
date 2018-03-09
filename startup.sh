#!/bin/bash

cd /opt/slick
virtualenv -p python2 vpy
vpy/bin/pip install -r requirements.txt
./add-indexes.py

/usr/sbin/apache2ctl -D FOREGROUND
