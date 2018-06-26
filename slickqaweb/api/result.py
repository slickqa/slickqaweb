from .standardResponses import JsonResponse, read_request
from .project import get_project
from slickqaweb.utils import is_provided, is_not_provided
from slickqaweb.model.query import queryFor
from slickqaweb.app import app
from slickqaweb.api.project import get_release, get_build
from slickqaweb.model.result import Result, NON_FINAL_STATUS
from slickqaweb.model.serialize import deserialize_that
from slickqaweb.model.resultReference import ResultReference
from slickqaweb.model.logEntry import LogEntry
from slickqaweb.model.dereference import find_testcase_by_reference, find_project_by_reference, find_testrun_by_reference, find_component_by_reference, find_release_by_reference, find_build_by_reference, find_configuration_by_reference
from slickqaweb.model.reference import create_project_reference, create_testcase_reference, create_component_reference, create_release_reference, create_build_reference, create_configuration_reference, create_testrun_reference, create_result_reference
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.testcase import Testcase
from slickqaweb.model.step import Step
from slickqaweb.model.recurringNote import RecurringNote
from slickqaweb.model.component import Component
from slickqaweb.model.release import Release
from slickqaweb.model.build import Build
from slickqaweb.model.configuration import Configuration
from slickqaweb.model.storedFile import StoredFile
from slickqaweb.model.configurationReference import ConfigurationReference
from slickqaweb import events
from apidocs import add_resource, accepts, returns, argument_doc, standard_query_parameters, note
from mongoengine import ListField, ReferenceField, IntField, EmbeddedDocumentField, Q, connection
import logging
import sys

from bson import ObjectId
import types
import datetime
from mongoengine import Q
from flask import request, Response

__author__ = 'jcorbett'

add_resource('/results', 'Add, Update or delete results.')


def find_history(result):
    assert isinstance(result, Result)
    history = []

    # other results with the same Test, Testplan, Environment, Release
    try:
        query = {"testcase__testcaseId": result.testcase.testcaseId,
                 "recorded__lt":result.recorded}
        if hasattr(result, 'config') and result.config is not None:
            query['config__configId'] = result.config.configId
        else:
            query['config__exists'] = False
        if hasattr(result, 'release') and result.release is not None:
            query['release__releaseId'] = result.release.releaseId
        else:
            query['release__exists'] = False
        if hasattr(result.testrun, 'testplanId') and result.testrun.testplanId is not None:
            query['testrun__testplanId'] = result.testrun.testplanId
        else:
            query['testrun__testplanId__exists'] = False

        for hresult in Result.objects(**query).fields(id=1, status=1, recorded=1, build=1).order_by('-recorded').limit(10):
            history.append(create_result_reference(hresult))
    except:
        logger = logging.getLogger('slickqaweb.api.result.find_history')
        logger.error("Error in finding history", exc_info=sys.exc_info())
    return history


def apply_triage_notes(result, testcase=None):
    """This function checks to see if a result should have triage notes, and adds them if need be.
    If the result's status is a non-final result, then it will be ignored.

    You can optionally pass in a testcase (if you have already looked one up), if you do not, it will be looked up.

    :param result: The result to check
    :type result: slickqa.model.result.Result
    :param testcase: A testcase that has been looked up from the database.
    :type testcase: slickqa.model.testcase.Testcase
    :returns: Nothing
    """
    # if the test isn't finished yet just return
    if result.status in NON_FINAL_STATUS:
        return

    # if the test is finished, but they didn't pass in the testcase, find it
    if testcase is None:
        testcase = find_testcase_by_reference(result.testcase)

    # if we still don't know the testcase we can't apply any triage notes
    if testcase is None:
        return

    assert isinstance(testcase, Testcase)

    # if there are no active notes on the testcase, move on
    if is_not_provided(testcase, 'activeNotes'):
        return

    # go through each active triage note, check to see if it matches
    notes_to_remove = []
    for activeNote in testcase.activeNotes:
        assert isinstance(activeNote, RecurringNote)
        # check to see if the environment matches
        if is_provided(activeNote, 'environment'):
            if is_not_provided(result, 'config') or is_not_provided(result.config, 'configId') or \
               activeNote.environment.configId != result.config.configId:
                continue

        # check to see if the release matches
        if is_provided(activeNote, 'release'):
            if is_not_provided(result, 'release') or is_not_provided(result.release, 'releaseId') or \
               activeNote.release.releaseId != result.release.releaseId:
                continue

        # at this point it matches
        if result.status == 'PASS':
            # update the note to be inactive
            notes_to_remove.append(activeNote)
        else:
            # apply the triage note
            if is_not_provided(result, 'log'):
                result.log = []
            logentry = LogEntry()
            logentry.entryTime = datetime.datetime.now()
            logentry.level = 'WARN'
            logentry.loggerName = 'slick.note'
            logentry.message = activeNote.message
            if is_provided(activeNote, 'url'):
                logentry.exceptionMessage = activeNote.url
            result.log.append(logentry)

    # move any notes that are no longer active (because the test passed) to the inactiveNotes section
    if len(notes_to_remove) > 0:
        # if we are modifying the testcase we need to generate an event
        update_event = events.UpdateEvent(before=testcase)
        for note in notes_to_remove:
            # remove from activeNotes and put in inactiveNotes
            testcase.activeNotes.remove(note)
            if is_not_provided(testcase, 'inactiveNotes'):
                testcase.inactiveNotes = []
            testcase.inactiveNotes.append(note)
            # set the inactivatedBy field to this result
            note.inactivatedBy = create_result_reference(result)
        update_event.after(testcase)
        testcase.save()


@app.route('/api/results')
@standard_query_parameters
@returns(ListField(ReferenceField(Result)))
def get_results():
    """Query for results."""
    args = request.args.to_dict()
    if args.has_key('testrunid'):
        args['testrun.testrunId'] = request.args['testrunid']
        del args['testrunid']
    if args.has_key('excludestatus'):
        args['q'] = "ne(status,\"{}\")".format(args['excludestatus'])
        del args['excludestatus']
    if args.has_key('allfields'):
        del args['allfields']
    if not args.has_key("orderby"):
        args["orderby"] = '-recorded'

    return JsonResponse(queryFor(Result, args))


@app.route('/api/results/count')
@standard_query_parameters
@returns(IntField(help_text="The number of results found from the query."))
@note("Useful for gathering statistics.")
def get_result_counts():
    """Get the number of results for a query."""
    return JsonResponse(queryFor(Result).count())


@app.route('/api/results/<result_id>')
@argument_doc('result_id', 'The result id (a string representation of the result\'s ObjectId).')
@returns(Result)
def get_result_by_id(result_id):
    """Get a result by id."""
    return JsonResponse(Result.objects(id=result_id).first())


@app.route('/api/results', methods=["POST"])
@app.route('/api/testruns/<testrun_id>/results', methods=["POST"])
@accepts(Result)
@returns(Result)
@note("""For all the embedded types, if what you specify doesn't exist, this api will try to create them.
If you do not specify a testrun, one will be created for you.  If you do not specify any testcase information,
This will return an error.""")
def add_result(testrun_id=None):
    """Create a new result."""
    raw = read_request()
    new_result = deserialize_that(raw, Result())
    assert isinstance(new_result, Result)

    # validate --------------------------------------------------------------
    # you must have a testcase reference (some info about the testcase) and a
    # status for the result.  Otherwise it's not really a result.
    errors = []
    if is_not_provided(new_result, 'status'):
        errors.append("status must be set")
    if is_not_provided(new_result, 'testcase') or (is_not_provided(new_result.testcase, 'name') and
                                               is_not_provided(new_result.testcase, 'testcaseId') and
                                               is_not_provided(new_result.testcase, 'automationId') and
                                               is_not_provided(new_result.testcase, 'automationKey')):
        errors.append("testcase must be provided with at least one identifying piece of data")
    if len(errors) > 0:
        return Response('\r\n'.join(errors), status=400, mimetype="text/plain")

    # fill in defaults -------------------------------------------------------
    # a few fields can easily be inferred or set to a default

    if is_not_provided(new_result, 'runstatus'):
        if new_result.status == "NO_RESULT":
            new_result.runstatus = "TO_BE_RUN"
        else:
            new_result.runstatus = "FINISHED"
    if is_not_provided(new_result, 'recorded'):
        new_result.recorded = datetime.datetime.utcnow()

    # resolve references -----------------------------------------------------
    testrun = None
    project = None
    testcase = None
    release = None
    build = None
    component = None
    configuration = None

    if testrun_id is not None:
        testrun = Testrun.objects(id=testrun_id).first()
        if testrun is not None:
            new_result.testrun = create_testrun_reference(testrun)

    # the order in this section is important.  We try to find information any way we can,
    # so if it's not provided in the result, we look at the testrun, if it's not in the testrun,
    # but it is in the testcase we get it from there.

    # first lookup the testrun and resolve it if we can
    if is_provided(new_result, 'testrun') and testrun is None:
        testrun = find_testrun_by_reference(new_result.testrun)
        # don't create a new testrun if it's null, we'll do that later after we resolve the other
        # pieces of information

    # try to resolve the testcase, we won't try to create it if it's none yet.
    # for that we need to resolve as much of the other information we can.
    testcase = find_testcase_by_reference(new_result.testcase)

    # try to find the project from the data provided in the result.  If that doesn't work,
    # and we do have a testrun, see if we can get it from there.  If we do have a name of a
    # project and we still haven't found the project, create it!
    if is_provided(new_result, 'project'):
        project = find_project_by_reference(new_result.project)
        if project is None and testrun is not None and is_provided(testrun, 'project'):
            project = find_project_by_reference(testrun.project)
        if project is None and is_provided(new_result.project, 'name'):
            project = Project()
            project.name = new_result.project.name
            project.save()

    # if they didn't provide any project data, but did provide testrun data, try
    # to resolve the project from the testrun
    if project is None and testrun is not None and is_provided(testrun, 'project'):
        project = find_project_by_reference(testrun.project)

    # if we couldn't resolve the project previously, but we can resolve the testcase
    # see if we can get the project from the testcase
    if project is None and testcase is not None and is_provided(testcase, 'project'):
        project = find_project_by_reference(testcase.project)


    # finally, make sure that the reference we have in the result has all the info in it
    if project is not None:
        new_result.project = create_project_reference(project)

    # resolve the component
    if is_provided(new_result, 'component'):
        if project is not None:
            component = find_component_by_reference(project, new_result.component)
            if component is None:
                component = Component()
                component.id = ObjectId()
                component.name = new_result.component.name
                if is_provided(new_result.component, 'code'):
                    component.code = new_result.component.code
                else:
                    component.code = component.name.lower().replace(' ', '-')
                project.components.append(component)
                project.save()
    if component is not None:
        new_result.component = create_component_reference(component)

    # create a testcase if needed
    if testcase is None and is_not_provided(new_result.testcase, 'name'):
        return Response('Existing testcase not found, please provide a testcase name if you want one to be created.\n', status=400, mimetype="text/plain")
    elif testcase is None:
        testcase = Testcase()
        testcase.name = new_result.testcase.name
        if is_provided(new_result.testcase, 'automationId'):
            testcase.automationId = new_result.testcase.automationId
        if is_provided(new_result.testcase, 'automationKey'):
            testcase.automationKey = new_result.testcase.automationKey
        if project is not None:
            testcase.project = create_project_reference(project)
        if component is not None:
            testcase.component = create_component_reference(component)
        testcase.save()
    testcase_changed = False
    if 'steps' in raw['testcase']:
        testcase.steps = []
        for raw_step in raw['testcase']['steps']:
            step = deserialize_that(raw_step, Step())
            testcase.steps.append(step)
        testcase_changed = True
    if 'purpose' in raw['testcase']:
        testcase.purpose = raw['testcase']['purpose']
        testcase_changed = True
    if 'requirements' in raw['testcase']:
        testcase.requirements = raw['testcase']['requirements']
        testcase_changed = True
    if 'author' in raw['testcase']:
        testcase.author = raw['testcase']['author']
        testcase_changed = True
    # TODO: feature and automationTool

    if testcase_changed:
        testcase.save()

    # no matter what testcase should not be None at this point, but just in case I made a mistake
    if testcase is None:
        return Response('Somehow I was unable to find or create a testcase for this result.\n', status=400, mimetype="text/plain")
    new_result.testcase = create_testcase_reference(testcase)

    # dereference release and build if possible
    if is_provided(new_result, 'release') and project is not None:
        release = find_release_by_reference(project, new_result.release)
    if release is None and testrun is not None and is_provided(testrun, 'release'):
        release = find_release_by_reference(testrun.release, new_result.release)
    if release is None and project is not None and is_provided(new_result, 'release') and is_provided(new_result.release, 'name'):
        release = Release()
        release.id = ObjectId()
        release.name = new_result.release.name
        project.releases.append(release)
        project.save()
    if release is not None:
        new_result.release = create_release_reference(release)
        if is_provided(new_result, 'build'):
            build = find_build_by_reference(release, new_result.build)
        if build is None and testrun is not None and is_provided(testrun, 'build'):
            build = find_build_by_reference(release, testrun.build)
        if build is None and project is not None and is_provided(new_result, 'build') and is_provided(new_result.build, 'name'):
            build = Build()
            build.id = ObjectId()
            build.name = new_result.build.name
            build.built = datetime.datetime.utcnow()
            release.builds.append(build)
            project.save()
        if build is not None:
            new_result.build = create_build_reference(build)

    # dereference configuration
    if is_provided(new_result, 'config'):
        configuration = find_configuration_by_reference(new_result.config)
    if configuration is None and testrun is not None and is_provided(testrun, 'config'):
        configuration = find_configuration_by_reference(testrun.config)
    if configuration is None and is_provided(new_result, 'config') and is_provided(new_result.config, 'name'):
        configuration = Configuration()
        configuration.name = new_result.config.name
        if is_provided(new_result.config, 'filename'):
            configuration.filename = new_result.config.filename
        configuration.save()
    if configuration is not None:
        new_result.config = create_configuration_reference(configuration)

    # if there is no testrun, create one with the information provided
    if testrun is None:
        testrun = Testrun()
        if is_provided(new_result, 'testrun') and is_provided(new_result.testrun, 'name'):
            testrun.name = new_result.testrun.name
        else:
            testrun.name = 'Testrun starting %s' % str(datetime.datetime.utcnow())
        if project is not None:
            testrun.project = create_project_reference(project)
        if configuration is not None:
            testrun.config = create_configuration_reference(configuration)
        if release is not None:
            testrun.release = create_release_reference(release)
        if build is not None:
            testrun.build = create_build_reference(build)
        testrun.dateCreated = datetime.datetime.utcnow()
        testrun.runStarted = datetime.datetime.utcnow()
        testrun.state = 'RUNNING'
        testrun.save()

    if testrun is not None:
        new_result.testrun = create_testrun_reference(testrun)

        status_name = "inc__summary__resultsByStatus__" + new_result.status
        Testrun.objects(id=testrun.id).update_one(**{status_name: 1})

    apply_triage_notes(new_result, testcase)
    new_result.history = find_history(new_result)
    new_result.save()

    events.CreateEvent(new_result)
    return JsonResponse(new_result)


@app.route('/api/results/<result_id>', methods=["PUT"])
@argument_doc('result_id', 'The result id (a string representation of the result\'s ObjectId).')
@accepts(Result)
@returns(Result)
@note("You only need to specify the items that have changed.")
def update_result(result_id):
    """Update an individual result."""
    orig = Result.objects(id=result_id).first()
    update_event = events.UpdateEvent(before=orig)
    update = read_request()
    print(repr(update))

    if 'status' in update and update['status'] != orig.status:
        atomic_update = {
            'dec__summary__resultsByStatus__' + orig.status: 1,
            'inc__summary__resultsByStatus__' + update['status']: 1
        }
        update_testrun_event = None
        testrun = None
        if app.config['events']:
            testrun = Testrun.objects(id=orig.testrun.testrunId).first()
            update_testrun_event = events.UpdateEvent(before=testrun)
        Testrun.objects(id=orig.testrun.testrunId).update_one(**atomic_update)
        if app.config['events']:
            testrun.reload()
            update_testrun_event.after(testrun)
    deserialize_that(update, orig)
    apply_triage_notes(orig)
    orig.save()
    update_event.after(orig)
    return JsonResponse(orig)


@app.route('/api/results/<result_id>/log', methods=["POST"])
@argument_doc('result_id', 'The result id (a string representation of the result\'s ObjectId).')
@accepts(ListField(EmbeddedDocumentField(LogEntry)))
@returns(ListField(EmbeddedDocumentField(LogEntry)))
def add_to_log(result_id):
    """Append log entries to a result."""
    orig = Result.objects(id=result_id).first()
    if not hasattr(orig, 'log') or orig.log is None:
        orig.log = []

    list_of_log_entries = read_request()
    if isinstance(list_of_log_entries, types.ListType):
        for entry_json in list_of_log_entries:
            orig.log.append(deserialize_that(entry_json, LogEntry()))
    else:
        orig.log.append(deserialize_that(list_of_log_entries, LogEntry()))
    orig.save()
    return JsonResponse(len(orig.log))


@app.route('/api/results/<result_id>/reschedule')
@argument_doc('result_id', 'the result id (a string representation of the result\'s ObjectId).')
@returns(Result)
def reschedule_individual_result(result_id):
    """Reschedule a single result, only works on a result that was originally scheduled."""
    orig = Result.objects(id=result_id).first()
    orig_status = orig.status
    log = []
    if orig.log:
        log = orig.log
    if 'retry_count' in orig.attributes:
        orig.attributes['retry_count'] = str(int(orig.attributes['retry_count']) + 1)
    else:
        orig.attributes['retry_count'] = "1"
    if 'max_retry' not in orig.attributes:
        orig.attributes['max_retry'] = "3"
    if orig_status != "NO_RESULT":
        decrement_orig_status_by = "dec__summary__resultsByStatus__" + orig_status
        increment_noresult_status_by = "inc__summary__resultsByStatus__NO_RESULT"
        Testrun.objects(id=orig.testrun.testrunId).update_one(**{decrement_orig_status_by: 1, increment_noresult_status_by: 1})
    log.append({"entryTime": datetime.datetime.utcnow(), "level": "INFO", "loggerName": "slick.note", "message": "Rescheduled. Count: {}. Max: {}    {}    {}".format(orig.attributes['retry_count'], orig.attributes['max_retry'], orig.hostname, orig.reason), "exceptionMessage": ""})
    Result.objects(id=result_id).update(log=log, files=[], links=[], runstatus="SCHEDULED", status="NO_RESULT", recorded=datetime.datetime.utcnow(),
                                        unset__hostname=True, unset__started=True, unset__finished=True,
                                        unset__runlength=True, unset__reason=True, attributes=orig.attributes)
    orig.reload()
    return JsonResponse(orig)


@app.route('/api/results/<result_id>/cancel')
@argument_doc('result_id', 'the result id (a string representation of the result\'s ObjectId).')
@returns(Result)
def cancel_individual_result(result_id):
    """Reschedule a single result, only works on a result that was originally scheduled."""
    orig = Result.objects(id=result_id).first()
    orig_status = orig.status
    if orig_status == "NO_RESULT":
        decrement_orig_status_by = "dec__summary__resultsByStatus__" + orig_status
        increment_skipped_status_by = "inc__summary__resultsByStatus__SKIPPED"
        Testrun.objects(id=orig.testrun.testrunId).update_one(**{decrement_orig_status_by: 1, increment_skipped_status_by: 1})
        testrun = Testrun.objects(id=orig.testrun.testrunId).first()
        if testrun.summary.resultsByStatus.NO_RESULT == 0:
            # finish testrun
            testrun.runFinished = datetime.datetime.utcnow()
            testrun.state = "FINISHED"
            Testrun.objects(id=orig.testrun.testrunId).update_one(runFinished=testrun.runFinished, state=testrun.state)
    reason = request.args.get("reason") if request.args.get("reason") else "Run cancelled from slick."
    Result.objects(id=result_id).update(runstatus="FINISHED", status="SKIPPED", reason=reason)
    orig.reload()
    return JsonResponse(orig)


@app.route('/api/results/scheduledfor/<project>/<hostname>')
@argument_doc('project', 'The name or id of the project against which to look for scheduled results')
@argument_doc('hostname', 'The hostname of the machine wanting scheduled tests')
@returns(ListField(Result))
def get_scheduled_results(project, hostname):
    """Get scheduled tests and assign to a hostname."""
    proj = get_project(project)
    args = request.args.to_dict()
    limit = 10
    orderby = 'recorded'
    if 'limit' in args:
        limit = int(args['limit'])
    if 'orderby' in args:
        orderby = args['orderby']
    Result.objects(project__id=proj.id, runstatus='SCHEDULED').order_by(orderby).limit(limit).update(runstatus='TO_BE_RUN', hostname=hostname)
    return JsonResponse(Result.objects(project__id=proj.id, status='NO_RESULT', runstatus='TO_BE_RUN', hostname=hostname).order_by(orderby))


@app.route('/api/results/schedulemorefor/<project>/<hostname>')
@argument_doc('project', 'The name or id of the project against which to look for scheduled results')
@argument_doc('hostname', 'The hostname of the machine wanting scheduled tests')
@returns(ListField(Result))
def schedule_more_results(project, hostname):
    """Mark tests as scheduled for a particular hostname, only return those tests."""
    proj = get_project(project)
    args = request.args.to_dict()
    limit = 10
    orderby = 'recorded'
    if 'limit' in args:
        limit = int(args['limit'])
    if 'orderby' in args:
        orderby = args['orderby']
    results_to_schedule = Result.objects(project__id=proj.id, runstatus='SCHEDULED').order_by(orderby).limit(limit)
    scheduled_results = []
    for result in results_to_schedule:
        assert isinstance(result, Result)
        result_id = result.id
        number_of_updated = Result.objects(id=result_id, runstatus='SCHEDULED').update(runstatus='TO_BE_RUN', hostname=hostname)
        if number_of_updated > 0:
            result.reload()
            scheduled_results.append(result)
    return JsonResponse(scheduled_results)


@app.route('/api/results/queue/<hostname>', methods=["POST"])
def get_single_scheduled_result(hostname):
    parameters = read_request()
    """:type : dict"""
    rawquery = {'runstatus': 'SCHEDULED',
                'status': 'NO_RESULT'}
    update = {'set__runstatus': 'TO_BE_RUN',
              'set__hostname': hostname}
    attr_query = dict(**parameters)
    if 'project' in attr_query:
        del attr_query['project']
    if 'release' in attr_query:
        del attr_query['release']
    if 'build' in attr_query:
        del attr_query['build']
    if 'provides' in attr_query:
        del attr_query['provides']
    for key, value in attr_query.items():
        rawquery["attributes.{}".format(key)] = value

    project_id, release_id, build_id = Project.lookup_project_release_build_ids(parameters.get('project', None),
                                                                                parameters.get('release', None),
                                                                                parameters.get('build', None))
    if project_id is not None:
        rawquery['project.id'] = project_id
    else:
        rawquery['project.name'] = parameters.get('project', None)
    if release_id is not None:
        rawquery['release.releaseId'] = release_id
    elif parameters.get('release', None) is not None:
        rawquery['release.name'] = parameters.get('release', None)
    if build_id is not None:
        rawquery['build.buildId'] = build_id
    elif parameters.get('build', None) is not None:
        rawquery['build.name'] = parameters.get('build', None)

    # if 'project' in parameters:
    #     project = get_project(parameters["project"])
    #     if project is not None:
    #         rawquery['project.id'] = project.id
    #     else:
    #         rawquery['project.name'] = parameters["project"]
    # if 'release' in parameters:
    #     if project is not None:
    #         release = get_release(project, parameters['release'])
    #     if release is not None:
    #         rawquery['release.releaseId'] = release.id
    #     else:
    #         rawquery['release.name'] = parameters['release']
    # if 'build' in parameters:
    #     if release is not None:
    #         build = get_build(release, parameters['build'])
    #     if build is not None:
    #         rawquery['build.buildId'] = build.id
    #     else:
    #         rawquery['build.name'] = parameters['build']
    provides = []
    if 'provides' in parameters:
        provides = parameters['provides']
    # from http://stackoverflow.com/questions/22518867/mongodb-querying-array-field-with-exclusion
    rawquery['requirements'] = {'$not': {'$elemMatch': {'$nin': provides}}}
    import mongoengine
    # mongoengine.QuerySet.modify()
    result = Result.objects(__raw__=rawquery).order_by("recorded").modify(new=True, full_response=True, **update)
    # query = {}
    # if 'project' in parameters:
    #    query['project__name'] = parameters['project']
    # if 'release' in parameters:
    #    query['release__name'] = parameters['release']
    # if 'build' in parameters:
    #    query['build__name'] = parameters['build']

    return JsonResponse(result["value"])


@app.route('/api/results/queue/statistics')
def get_queue_statistics():
    conn = connection.get_connection()
    result = conn[app.config['MONGODB_DBNAME']]['results'].aggregate([{'$match': {'status': 'NO_RESULT', 'runstatus': 'SCHEDULED'}}, {'$group': {'_id': {'requirements': '$requirements', 'project': '$project.name', 'release': '$release.name', 'build': '$build.name'}, 'date': {'$last': '$recorded'}, 'count': {'$sum': 1}}}])
    return JsonResponse(result['result'])


@app.route('/api/results/<result_id>/files', methods=['POST'])
@accepts(StoredFile)
@returns(StoredFile)
@note("The chunkSize will be set by the server for you, even if you provide it.  Make sure you supply a valid mimetype.")
def add_stored_file_to_result(result_id):
    new_stored_file = deserialize_that(read_request(), StoredFile())
    new_stored_file.chunkSize = 262144
    new_stored_file.save()
    orig = Result.objects(id=result_id).first()
    if not hasattr(orig, 'files') or orig.files is None:
        orig.files = []
    orig.files.append(new_stored_file)
    orig.save()
    return JsonResponse(new_stored_file)

