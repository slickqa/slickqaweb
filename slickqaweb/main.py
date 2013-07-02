__author__ = 'jcorbett'

from flask import render_template, Response

import os
import fnmatch
from cStringIO import StringIO
import subprocess

from slickqaweb.app import app
import api

for module in api.modules:
    print "Found module slickqaweb.api.{}".format(module)

def find_files(dir, pattern):
    matches = []
    for root, dirnames, filenames in os.walk(dir):
        for filename in fnmatch.filter(filenames, pattern):
            matches.append(os.path.join(root, filename)[len(dir) + 1:])
    return matches

def get_catalog_files(dir, pattern):
    # load the catalog file (if it exists)
    catalog = []
    if os.path.exists(os.path.join(dir, 'catalog')):
        with open(os.path.join(dir, 'catalog'), 'r') as catalog_file:
            for line in catalog_file:
                stripped_line = line.rstrip()
                if stripped_line != '':
                    catalog.append(stripped_line)

    # create sets out of the catalog file and the files we find
    catalog_set = set(catalog)
    files_set = set(find_files(dir, pattern))

    # find the files that don't exist in the catalog and add them to the end
    # we intentionally leave files in the catalog that don't exist anymore
    # in case they show back up
    missing = files_set - catalog_set
    if len(missing) > 0:
        with open(os.path.join(dir, 'catalog'), 'a') as catalog_file:
            catalog_file.write("\n".join(missing))
        catalog.append(missing)

    # return the ordered catalog (not the set)
    return catalog

########################### build scripts.js #############################
scripts_dir = os.path.join(os.path.dirname(__file__), 'static', 'scripts')
scriptsjs = StringIO()
for script in get_catalog_files(scripts_dir, "*.js"):
    if os.path.exists(os.path.join(scripts_dir, script)):
        with open(os.path.join(scripts_dir, script), 'r') as script_file:
            scriptsjs.write(script_file.read())


@app.route('/scripts.js')
def combined_scriptsjs():
    scriptsjs.seek(0)
    return Response(scriptsjs.read(), mimetype='application/javascript')


########################### build style.css #############################
style_dir = os.path.join(os.path.dirname(__file__), 'static', 'styles')
less_source = StringIO()
for less_script in get_catalog_files(style_dir, '*.less'):
    if os.path.exists(os.path.join(style_dir, less_script)):
        with open(os.path.join(style_dir, less_script), 'r') as less_script_file:
            less_source.write(less_script_file.read())

# run the less source through the less compiler
main_css = StringIO()
less_source.seek(0)
less_compiler = subprocess.Popen(['lessc', '-s', '-'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
main_css.write(less_compiler.communicate(less_source.read())[0])

less_compiler.wait()

@app.route('/style.css')
def compiled_style():
    main_css.seek(0)
    return Response(main_css.read(), mimetype='text/css')

# initialize with other apis
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    print("Default catch-all round called with path: {}".format(path))
    base = app.config['APPLICATION_ROOT']
    if base is None:
        base = "/"
    return render_template('index.html', base=base)

