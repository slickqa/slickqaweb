__author__ = 'jcorbett'

import os
import nose
import tempfile



if __name__ == '__main__':
    results = tempfile.NamedTemporaryFile(suffix=".xml", delete=False)
    results_filename = results.name
    results.close()

    nose.run(argv=['slickqawebtest', '-v', '--all-modules', os.path.dirname(__file__), '--with-xunit', '--xunit-file', results_filename])

