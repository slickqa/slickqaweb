#!/bin/bash

virtualenv vpy
vpy/bin/pip install -r requirements.txt
cd slickqaweb/static
bower install
