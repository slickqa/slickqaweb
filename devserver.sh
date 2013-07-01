#!/bin/bash

vpy/bin/watchmedo auto-restart -R -D -d slickqaweb -i '*.swp;*.pyc;' ./server.py
