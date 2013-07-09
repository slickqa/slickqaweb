__author__ = 'jcorbett'

from flask import render_template, Response
from flask_gzip import Gzip

from slickqaweb.app import app
from slickqaweb.slicklogging import initialize_logging
from slickqaweb import compiledResources

import os
import api
import logging

app.config.from_object('slickqaweb.settings')
if 'SLICK_SETTINGS' in os.environ:
    app.config.from_envvar("SLICK_SETTINGS")
initialize_logging(app.config)

logger = logging.getLogger("slickqaweb.main")
logger.info("Slick Web App Server starting...")
#Gzip(app)

compiledResources.main_css.seek(0, os.SEEK_END)
logger.debug("main.css is %d bytes in length.", compiledResources.main_css.tell())
for module in api.modules:
    logger.debug("Found module slickqaweb.api.%s", module)

from mongoengine import connect
mongo_hostname = app.config['MONGODB_HOSTNAME']
mongo_dbname = app.config['MONGODB_DBNAME']
logger.debug("Connecting to mongo database '%s' on host '%s'.", mongo_dbname, mongo_hostname)
connect(host=mongo_hostname, db=mongo_dbname)

# initialize with other apis
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    print("Default catch-all round called with path: {}".format(path))
    base = app.config['APPLICATION_ROOT']
    if base is None:
        base = "/"
    return render_template('index.html', base=base)

