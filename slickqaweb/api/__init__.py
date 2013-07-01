__author__ = 'jcorbett'

import glob
import os

# this little gem will import every .py file in this directory
# the advantage is that we can just import configuration.compilesteps and all the
# @compile_step annotations will be processed.

compile_steps_path = os.path.dirname(__file__)
compile_steps_path_length = len(compile_steps_path)

modules = []
for name in glob.glob(os.path.join(compile_steps_path,'*.py')):
    if not name.endswith('__init__.py'):
        modules.append(name[compile_steps_path_length + 1:-3])

modules.sort()
for module in modules:
    __import__("slickqaweb.api", globals(), locals(), fromlist=[module,])


