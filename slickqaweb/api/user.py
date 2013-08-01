__author__ = 'jcorbett'

from slickqaweb.app import app
from flask import g, Response


@app.route("/api/users/<email>")
def get_current_user(email):
    if "current" == email:
        if g.user is not None:
            return Response(g.user.to_json(), mimetype='application/json')
        else:
            return Response(status=404)

