__author__ = 'jcorbett'

from slickqaweb.app import app

@app.route('/api/version')
def get_version():
    return "3.0.0.0.0.0.0.0"
