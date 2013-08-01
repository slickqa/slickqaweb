__author__ = 'jcorbett'

from slickqaweb.app import app
from slickqaweb.model.userAccount import UserAccount
from flask import g, session, redirect, request, render_template
from flask_openid import OpenID

import logging
logger = logging.getLogger("slickqaweb.api.login")

oid = OpenID(app, 'tmp')
Users = {}

@app.before_request
def lookup_current_user():
    g.user = None
    if 'openid' in session:
        logger.debug('Found openid in session, value=%s', session['openid'])
        g.user = UserAccount.objects(openid=session['openid']).first()


@app.route('/login', methods=['GET', 'POST'])
@oid.loginhandler
def login():
    logger.debug("login called.")
    if g.user is not None:
        logger.debug("g.user is not None: %s", repr(g.user))
        return redirect(oid.get_next_url())
    logger.debug("Got past g.user check")
    if request.method == 'POST':
        openid = request.form.get('openid')
        if openid:
            return oid.try_login(openid, ask_for=['email', 'fullname',
                                                  'nickname'])
    logger.debug("Going to render login.html")
    return render_template('login.html', next=oid.get_next_url(),
                           error=oid.fetch_error())

@oid.after_login
def create_or_login(resp):
    logger.debug("Inside create_or_login")
    session['openid'] = resp.identity_url
    user = UserAccount.objects(openid=resp.identity_url).first()
    if user is None:
        user = UserAccount(openid=resp.identity_url, email=resp.email, full_name=resp.fullname, short_name=resp.nickname)
        user.save()
    return redirect(oid.get_next_url())

@app.route('/logout')
def logout():
    session.pop('openid', None)
    return redirect(oid.get_next_url())