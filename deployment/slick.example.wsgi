#!/usr/bin/python2.7

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

if os.path.exists(os.path.join(os.path.dirname(__file__), 'vpy', 'bin', 'activate_this.py')):
    activate_this = os.path.join(os.path.dirname(__file__), 'vpy', 'bin', 'activate_this.py')
    execfile(activate_this, dict(__file__=activate_this))

import os
os.environ['SLICK_SETTINGS'] = os.path.join(os.path.dirname(__file__), 'prodserver.cfg')
os.chdir(os.path.dirname(__file__))

from slickqaweb.main import app as application
