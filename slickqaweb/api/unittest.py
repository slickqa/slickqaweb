__author__ = 'jcorbett'

import os
import re
import sys
import subprocess
import json
import xml.etree.ElementTree as ET

from flask import Response

from slickqaweb.app import app

if os.path.exists(os.path.join(os.path.dirname(__file__), '..', '..', 'slickqawebtest')):

    xml_filename_pattern = re.compile('XML: (.*?)$', re.MULTILINE)

    @app.route('/api/unittests')
    def get_unittest_results():
        output = ""
        try:
            output = (subprocess.check_output([sys.executable, '-m', 'slickqawebtest.xunit'], stderr=subprocess.STDOUT)).decode("utf-8")
        except subprocess.CalledProcessError as e:
            output = e.output.decode("utf-8")

        xml_filename = ""
        filename_matcher = re.search(xml_filename_pattern, output)
        if filename_matcher is not None:
            xml_filename = filename_matcher.group(1)

        results = {
            "totalrun": 0,
            "totalpassed": 0,
            "totalfailed": 0,
            "state": "FINISHED",
            "passed": [],
            "failed": []
        }
        if os.path.exists(xml_filename):
            tree = ET.parse(xml_filename)
            root = tree.getroot()
            results["totalrun"] = int(root.attrib["tests"])
            results["totalfailed"] = int(root.attrib["errors"]) + int(root.attrib["failures"])
            results["totalpassed"] = results["totalrun"] - results["totalfailed"]

            for testcase in root:
                test = { "path": testcase.attrib["classname"],
                         "name": testcase.attrib["name"]}
                if len(testcase) > 0:
                    failure = testcase[0]
                    message = failure.attrib["message"] + "\n"
                    message = message + failure.text
                    test["message"] = message
                    results["failed"].append(test)
                else:
                    results["passed"].append(test)
            os.unlink(xml_filename)

        return Response(json.dumps(results), content_type='application/json')
