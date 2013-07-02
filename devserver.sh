#!/bin/bash

vpy/bin/watchmedo auto-restart -R -d slickqaweb -i '*.swp;*.pyc;' ./server.py
