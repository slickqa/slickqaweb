#!/bin/bash

virtualenv vpy
vpy/bin/pip install -r requirements.txt
vpy/bin/python -c 'import uuid; print uuid.uuid4();' >secret_key.txt
cd slickqaweb/static
bower install
