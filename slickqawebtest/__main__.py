__author__ = 'jcorbett'

import nose
import os

nose.run(argv=['slickqawebtest', '-v', '--all-modules', os.path.dirname(__file__)])
