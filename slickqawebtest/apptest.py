__author__ = 'jcorbett'

import slickqaweb.app
import flask

from nose.tools import istest
from slickqawebtest.asserts import *

@istest
def test_app_is_flask_app():
    assert_is_instance(slickqaweb.app.app, flask.Flask, msg="The app object in slickqaweb.app should be an instance of flask.Flask")
