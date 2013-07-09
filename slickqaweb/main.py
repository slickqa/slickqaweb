__author__ = 'jcorbett'

from flask import render_template, Response
from flask_gzip import Gzip
from slickqaweb.app import app
from slickqaweb.slicklogging import initialize_logging
import os
import api

import compiledResources
compiledResources.main_css.seek(0, os.SEEK_END)
print "main.css is {} bytes in length.".format(compiledResources.main_css.tell())

app.config.from_object('slickqaweb.settings')
if 'SLICK_SETTINGS' in os.environ:
    app.config.from_envvar("SLICK_SETTINGS")
initialize_logging(app.config)
#Gzip(app)

for module in api.modules:
    print "Found module slickqaweb.api.{}".format(module)


from mongoengine import connect
dbname = 'slickij'
print "Connecting to database: {}".format(dbname)
connect(dbname)


# initialize with other apis
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    print("Default catch-all round called with path: {}".format(path))
    base = app.config['APPLICATION_ROOT']
    if base is None:
        base = "/"
    return render_template('index.html', base=base)

