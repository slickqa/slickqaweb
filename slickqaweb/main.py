__author__ = 'jcorbett'

from flask import render_template, Response, request
from mongoengine import connect


from slickqaweb.app import app
from slickqaweb.slicklogging import initialize_logging
from .amqpcon import connect_to_amqp
from .model.systemConfiguration.amqpSystemConfiguration import AMQPSystemConfiguration

import os
import sys
from . import api
import logging
import mimetypes

mimetypes.add_type('image/svg+xml', '.svg')

app.config.from_object('slickqaweb.settings')
if 'SLICK_SETTINGS' in os.environ:
    app.config.from_envvar("SLICK_SETTINGS")
initialize_logging(app)

logger = logging.getLogger("slickqaweb.main")
logger.info("Slick Web App Server starting...")

if 'SECRET_KEY_FILE' in app.config:
    with open(app.config['SECRET_KEY_FILE'], 'r') as secret_key_file:
        app.secret_key = secret_key_file.readline()
#Gzip(app)

connect_options = {
        "host": app.config['MONGODB_HOSTNAME'],
        "db": app.config['MONGODB_DBNAME']
}
logger.debug("Connecting to mongo database '%s' on host '%s'.", connect_options['host'], connect_options['db'])
if 'MONGODB_USERNAME' in app.config:
    connect_options['username'] = app.config['MONGODB_USERNAME']
if 'MONGODB_PASSWORD' in app.config:
    connect_options['password'] = app.config['MONGODB_PASSWORD']
if 'MONGODB_AUTHDB' in app.config:
    connect_options['authentication_source'] = app.config['MONGODB_AUTHDB']
try:
    connect(**connect_options)
except:
    logger.fatal("Error connecting to database: ", exc_info=sys.exc_info())
    raise
try:
    amqp_configuration = AMQPSystemConfiguration.objects().first()
    if amqp_configuration is not None:
        c = connect_to_amqp(amqp_configuration)
        app.config['event_connection'] = c[0]
        app.config['event_exchange'] = c[1]
    else:
        logger.info("No AMQP System Configuration defined, no events will be published.")
except:
    logger.warn('AMQP System Configuration was provided, but there was an error initializing it:', exc_info=sys.exc_info())

if 'event_connection' in app.config and 'event_exchange' in app.config and app.config['event_connection'].connected:
    logger.info('AMQP configuration complete, connection established, events are enabled.')
    app.config['events'] = True
else:
    logger.warn('Events are disabled')
    app.config['events'] = False


if app.debug:
    request_logger = logging.getLogger("access")
    @app.after_request
    def write_access_log(response):
        path = request.path
        if request.query_string:
            path = path + "?" + request.query_string.decode("utf-8")
        mimetype = response.mimetype
        if request.method != "GET":
            mimetype = "in:{},out:{}".format(request.mimetype, response.mimetype)
        request_logger.debug("%s %s = %d (%s)", request.method, path, response.status_code, mimetype)
        if response.status_code == 400 or response.status_code == 500:
            request_logger.warn("%s %s = %d (%s)", request.method, path, response.status_code, mimetype)
            data = request.data
            if not data:
                request_logger.warn('data was empty, grabbing data from for keys')
                data = list(request.form.keys())[0]
            request_logger.warn("Request Data: %s", data)
            request_logger.warn("Headers: %s", repr(request.headers))
        return response

@app.route('/apidocs')
def api_docs():
    base = app.config['APPLICATION_ROOT']
    if base is None:
        base = "/"
    return render_template('apidocs.html', base=base)

# initialize with other apis
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    base = app.config['APPLICATION_ROOT']
    if base is None:
        base = "/"
    min = '.min'
    if app.config['DEVELOPMENT']:
        min = ''
    return render_template('index.html', base=base, development=app.config['DEVELOPMENT'], debug=app.debug, min=min)

