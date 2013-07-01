__author__ = 'jcorbett'

from flask import render_template
from slickqaweb.app import app
import api

for module in api.modules:
    print "Found module api.{}".format(module)

# initialize with other apis
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    print("Default catch-all round called with path: {}".format(path))
    return render_template('index.html')

