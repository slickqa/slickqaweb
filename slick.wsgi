#!/usr/bin/python2.7

import sys
sys.path.insert(0, '/opt/slick')

activate_this = '/opt/slick/vpy/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

import os
os.environ['SLICK_SETTINGS'] = '/opt/slick/prodserver.cfg'
os.chdir('/opt/slick')

import newrelic.agent
newrelic.agent.initialize('newrelic.ini')

from slickqaweb.main import app as application
