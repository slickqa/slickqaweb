from slickqaweb.api.result import cancel_individual_result
from slickqaweb.model.result import Result

__author__ = 'Jared Jorgensen'

from slickqaweb.app import app
from slickqaweb.model.testrunGroup import TestrunGroup
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.query import queryFor
from slickqaweb.utils import *
import datetime
from flask import request, g
from .standardResponses import JsonResponse, read_request
from bson import ObjectId
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField

add_resource('/testrungroups', 'Add, update, and delete testrungroups.')


@app.route('/api/testrungroups')
@standard_query_parameters
@returns(ListField(ReferenceField(TestrunGroup)))
def get_testrungroups():
    """Query for testrungroups."""
    return JsonResponse(queryFor(TestrunGroup))

@app.route('/api/testrungroups/<testrungroup_id>')
@returns(TestrunGroup)
@argument_doc('testrungroup_id', "A Testrun Group's id (the string representation of a BSON ObjectId).")
def get_testrungroup_by_id(testrungroup_id):
    """Find a testrungroup by it's id."""
    return JsonResponse(TestrunGroup.objects(id=testrungroup_id).first())

@app.route('/api/testrungroups/<testrungroup_id>/cancel')
@argument_doc('project_name', 'The name of the project.')
@argument_doc('release_name', 'The name of the release in the project.')
@argument_doc('build_name', 'The name of the build in the release.')
@returns(ListField(Result))
def cancel_results_for_testrungroup(testrungroup_id):
    """Cancel all results that are scheduled for this testrungroup."""

    orig = TestrunGroup.objects(id=testrungroup_id).first()
    canceled_results = []
    if (hasattr(orig, 'testruns')) or orig.testruns is not None:
        for testrun in orig.testruns:
            results_to_cancel = Result.objects(testrun__testrunId=testrun.id, status='NO_RESULT', runstatus__in=['SCHEDULED', 'TO_BE_RUN'])
            canceled_results.extend(results_to_cancel)
            for result in results_to_cancel:
                cancel_individual_result(result.id)
        return JsonResponse(canceled_results)


@app.route('/api/testrungroups', methods=["POST"])
@returns(TestrunGroup)
@accepts(TestrunGroup)
@note("If you do not provide a created date, one will be created.")
def add_testrungroup():
    """Create a new testrungroup."""
    new_trg = deserialize_that(read_request(), TestrunGroup())
    if is_not_provided(new_trg, 'created'):
        new_trg.created = datetime.datetime.now()
    new_trg.save()
    return JsonResponse(new_trg)

@app.route('/api/testrungroups/<testrungroup_id>', methods=["PUT"])
@argument_doc('testrungroup_id', "A Testrun Group's id (the string representation of a BSON ObjectId).")
@returns(TestrunGroup)
@accepts(TestrunGroup)
def update_testrungroup(testrungroup_id):
    """Update a testrun group's properties."""
    orig = TestrunGroup.objects(id=testrungroup_id).first()
    deserialize_that(read_request(), orig)
    orig.save()
    return JsonResponse(orig)

@app.route('/api/testrungroups/<testrungroup_id>', methods=["DELETE"])
@argument_doc('testrungroup_id', "A Testrun Group's id (the string representation of a BSON ObjectId).")
@returns(TestrunGroup)
def delete_testrungroup(testrungroup_id):
    """Remove a testrun group"""
    orig = TestrunGroup.objects(id=testrungroup_id).first()
    orig.delete()
    return JsonResponse(orig)

@app.route('/api/testrungroups/<testrungroup_id>/addtestrun/<testrun_id>', methods=["POST"])
@argument_doc('testrungroup_id', "A Testrun Group's id (the string representation of a BSON ObjectId).")
@argument_doc('testrun_id', "A Testrun's id (the string representation of a BSON ObjectId).")
@returns(TestrunGroup)
def add_testrun_to_testrun_group(testrungroup_id, testrun_id):
    """Add a testrun to a testrun group"""
    orig = TestrunGroup.objects(id=ObjectId(testrungroup_id)).first()
    testrun = Testrun.objects(id=ObjectId(testrun_id)).first()
    if (not hasattr(orig, 'testruns')) or orig.testruns is None:
        orig.testruns = []
    orig.testruns.append(testrun)
    orig.save()
    return JsonResponse(orig)

@app.route('/api/testrungroups/<testrungroup_id>/removetestrun/<testrun_id>', methods=["DELETE"])
@argument_doc('testrungroup_id', "A Testrun Group's id (the string representation of a BSON ObjectId).")
@argument_doc('testrun_id', "A Testrun's id (the string representation of a BSON ObjectId).")
@returns(TestrunGroup)
def remove_testrun_from_testrun_group(testrungroup_id, testrun_id):
    """Remove a testrun from a testrun group"""
    orig = TestrunGroup.objects(id=ObjectId(testrungroup_id)).first()
    real_testrunid = ObjectId(testrun_id)
    index = -1
    for i in range(len(orig.testruns)):
        if orig.testruns[i].id == real_testrunid:
            index = i
            break
    if index >= 0:
        del orig.testruns[index]
        orig.save()
    return JsonResponse(orig)

