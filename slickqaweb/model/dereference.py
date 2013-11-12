__author__ = 'jcorbett'

from slickqaweb.model.testcase import Testcase
from slickqaweb.model.testcaseReference import TestcaseReference
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference

def find_testcase_by_reference(ref):
    """Find a testcase by using the data in the testcase reference

    This method uses an iterative approach to the information in the reference.
    Meaning that it looks at each piece of data, in a particular order, and tries
    to find the testcase by that information.

    The order the properties are searched in are:
        1. testcaseId
        2. automationId
        3. automationKey
        4. name

    The automationTool property is not considered unique, so it is not used for
    finding the testcase.

    :param ref: The TestcaseReference object that will be used to try to find the Testcase
    :return: A slickqaweb.model.testcase.Testcase instance on success, None on failure
    """
    assert isinstance(ref, TestcaseReference)
    testcase = None
    if hasattr(ref, 'testcaseId') and ref.testcaseId is not None:
        testcase = Testcase.objects(id=ref.testcaseId).first()
    if testcase is None and hasattr(ref, 'automationId') and ref.automationId is not None and ref.automationId != '':
        testcase = Testcase.objects(automationId=ref.automationId)
    if testcase is None and hasattr(ref, 'automationKey') and ref.automationKey is not None and ref.automationKey != '':
        testcase = Testcase.objects(automationKey=ref.automationKey)
    if testcase is None and hasattr(ref, 'name') and ref.name is not None and ref.name != '':
        testcase = Testcase.objects(name=ref.name)

    return testcase

def find_project_by_reference(ref):
    """Find a project by the information provided in the reference

    Find a project either by id or name (found in reference)

    :param ref: A slickqaweb.model.projectReference.ProjectReference instance
    :return: An instance of Project from the database if found, None otherwise
    """
    assert isinstance(ref, ProjectReference)
    project = None
    if hasattr(ref, 'id') and ref.id is not None:
        project = Project.objects(id=ref.id)
    if project is None and hasattr(ref, 'name') and ref.name is not None and ref.name != '':
        project = Project.objects(name=ref.name)
    return project
