__author__ = 'jcorbett'

from flask import render_template, Response, request
from flask_gzip import Gzip
from mongoengine import connect

from slickqaweb.app import app
from slickqaweb.slicklogging import initialize_logging
from slickqaweb import compiledResources

import os
import sys
import api
import logging

app.config.from_object('slickqaweb.settings')
if 'SLICK_SETTINGS' in os.environ:
    app.config.from_envvar("SLICK_SETTINGS")
initialize_logging(app.config)

logger = logging.getLogger("slickqaweb.main")
logger.info("Slick Web App Server starting...")
#Gzip(app)

if app.debug:
    compiledResources.main_css.seek(0, os.SEEK_END)
    logger.debug("main.css is %d bytes in length.", compiledResources.main_css.tell())
    for module in api.modules:
        logger.debug("Found module slickqaweb.api.%s", module)

mongo_hostname = app.config['MONGODB_HOSTNAME']
mongo_dbname = app.config['MONGODB_DBNAME']
logger.debug("Connecting to mongo database '%s' on host '%s'.", mongo_dbname, mongo_hostname)
try:
    connect(host=mongo_hostname, db=mongo_dbname)
except:
    logger.fatal("Error connecting to database: ", exc_info=sys.exc_info())
    logger.fatal("Unable to connect to mongodb database '%s' on host '%s'.", )


if app.debug:
    request_logger = logging.getLogger("access")
    @app.after_request
    def write_access_log(response):
        request_logger.debug("%s = %d", request.path, response.status_code)
        return response

# initialize with other apis
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    base = app.config['APPLICATION_ROOT']
    if base is None:
        base = "/"
    return render_template('index.html', base=base)

