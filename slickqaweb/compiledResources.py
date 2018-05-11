__author__ = 'jcorbett'

#from slickqaweb.app import app

from flask import Response, request

import os
import fnmatch
from cStringIO import StringIO
import subprocess
import hashlib
import logging
import gzip

logger = logging.getLogger('slickqaweb.compiledResources')


def find_files(dir, pattern):
    matches = []
    for root, dirnames, filenames in os.walk(dir):
        for filename in fnmatch.filter(filenames, pattern):
            matches.append(os.path.join(root, filename)[len(dir) + 1:])
    return matches

def get_catalog_files(dir, extension):
    # load the catalog file (if it exists)
    catalog = []
    if os.path.exists(os.path.join(dir, 'catalog-' + extension)):
        with open(os.path.join(dir, 'catalog-' + extension), 'r') as catalog_file:
            for line in catalog_file:
                stripped_line = line.rstrip()
                if stripped_line != '':
                    catalog.append(stripped_line)

    # create sets out of the catalog file and the files we find
    catalog_set = set(catalog)
    files_set = set(find_files(dir, '*.' + extension))

    # find the files that don't exist in the catalog and add them to the end
    # we intentionally leave files in the catalog that don't exist anymore
    # in case they show back up
    missing = files_set - catalog_set
    if len(missing) > 0:
        with open(os.path.join(dir, 'catalog-' + extension), 'a') as catalog_file:
            catalog_file.write("\n".join(missing) + "\n")
        catalog.append(missing)

    # return the ordered catalog (not the set)
    return catalog

########################### build scripts.js #############################
scripts_dir = os.path.join(os.path.dirname(__file__), 'static', 'resources')
scriptsjs = open(os.path.join(os.path.dirname(__file__), 'static', 'scripts.js'), 'w')
for script in get_catalog_files(scripts_dir, "js"):
    if os.path.exists(os.path.join(scripts_dir, script)):
        with open(os.path.join(scripts_dir, script), 'r') as script_file:
            scriptsjs.write(script_file.read())

#scripts_hash = hashlib.sha256()
#scriptsjs.seek(0)
#scripts_hash.update(scriptsjs.read())
#scripts_etag = scripts_hash.hexdigest()
#scriptsjs.seek(0)
scriptsjs.close()

# no more dynamic
#@app.route('/scripts.js')
#def combined_scriptsjs():
#    if 'If-None-Match' in request.headers and request.headers['If-None-Match'] == scripts_etag:
#        return Response(status=304)
#    scriptsjs.seek(0)
#    return Response(scriptsjs.read(), headers={'Etag': scripts_etag}, mimetype='application/javascript')


########################### build style.css #############################
style_dir = os.path.join(os.path.dirname(__file__), 'static', 'resources')
less_source = StringIO()
for less_script in get_catalog_files(style_dir, 'less'):
    if os.path.exists(os.path.join(style_dir, less_script)):
        with open(os.path.join(style_dir, less_script), 'r') as less_script_file:
            less_source.write(less_script_file.read())

# run the less source through the less compiler
main_css = open(os.path.join(os.path.dirname(__file__), 'static', 'style.css'), 'w')
less_source.seek(0)
less_compiler = subprocess.Popen(['lessc', '-s', '-'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
main_css.write(less_compiler.communicate(less_source.read())[0])

less_compiler.wait()

#main_css_hash = hashlib.sha256()
#main_css.seek(0)
#main_css_hash.update(main_css.read())
#maincss_etag = main_css_hash.hexdigest()
main_css.close()

#@app.route('/style.css')
#def compiled_style():
#    if 'If-None-Match' in request.headers and request.headers['If-None-Match'] == maincss_etag:
#        return Response(status=304)
#    main_css.seek(0)
#    return Response(main_css.read(), headers={'Etag': maincss_etag}, mimetype='text/css')


if os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'slickqawebtest')):
    jstests_dir = os.path.join(os.path.dirname(__file__), '..', 'slickqawebtest', 'jstests')
    jstestsjs = open(os.path.join(os.path.dirname(__file__), 'static', 'jstests.js'), 'w')
    for script in get_catalog_files(jstests_dir, "js"):
        if os.path.exists(os.path.join(jstests_dir, script)):
            with open(os.path.join(jstests_dir, script), 'r') as script_file:
                jstestsjs.write(script_file.read())
    jstestsjs.close()
    #jstests_hash = hashlib.sha256()
    #jstestsjs.seek(0)
    #jstests_hash.update(jstestsjs.read())
    #jstests_etag = jstests_hash.hexdigest()

    #@app.route('/jstests.js')
    #def combined_jstestsjs():
    #    if 'If-None-Match' in request.headers and request.headers['If-None-Match'] == jstests_etag:
    #        return Response(status=304)
    #    jstestsjs.seek(0)
    #    return Response(jstestsjs.read(), headers={'Etag': jstests_etag}, mimetype='application/javascript')

