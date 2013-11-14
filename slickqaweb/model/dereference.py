__author__ = 'jcorbett'

from slickqaweb.model.testcase import Testcase
from slickqaweb.model.testcaseReference import TestcaseReference
from slickqaweb.model.project import Project
from slickqaweb.model.projectReference import ProjectReference
from slickqaweb.model.componentReference import ComponentReference
from slickqaweb.model.releaseReference import ReleaseReference
from slickqaweb.model.buildReference import BuildReference
from slickqaweb.model.release import Release
from slickqaweb.model.testrun import Testrun
from slickqaweb.model.testrunReference import TestrunReference

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
    :return: An instance of Project from mongo if found, None otherwise
    """
    assert isinstance(ref, ProjectReference)
    project = None
    if hasattr(ref, 'id') and ref.id is not None:
        project = Project.objects(id=ref.id)
    if project is None and hasattr(ref, 'name') and ref.name is not None and ref.name != '':
        project = Project.objects(name=ref.name)
    return project

def find_testrun_by_reference(ref):
    """Find a testrun using a testrun reference instance.

    A testrun reference contains the name and the id, and those will be used to find
    the testrun.

    :param ref: a slickqaweb.model.testrunReference.TestrunReference instance
    :return: An instance of Testrun from mongo if found, None otherwise
    """
    if ref is None:
        return None
    assert isinstance(ref, TestrunReference)
    retval = None
    if ref.testrunId is not None:
        retval = Testrun.objects(id=ref.testrunId).first()
    if retval is None and ref.name is not None and ref.name != '':
        retval = Testrun.objects(name=ref.name).first()
    return retval

def find_component_by_reference(project, ref):
    """Find a component in a project using a component reference.

    :param project: An instance of slickqaweb.model.project.Project to search in for the component
    :param ref: An instance of slickqaweb.model.componentReference.ComponentReference
    :return: the component from the project on success, None on failure
    """
    if project is None or ref is None:
        return None
    assert isinstance(project, Project)
    assert isinstance(ref, ComponentReference)
    for component in project.components:
        if ref.id == component.id or ref.name == component.name or ref.code == component.code:
            return component
    else:
        return None

#
def find_release_by_reference(project, ref):
    """Find a release in a project using a release reference

    :param project: An instance of slickqaweb.model.project.Project to search in for the release
    :param ref: An instance of slickqaweb.model.releaseReference.ReleaseReference
    :return: the release from the project on success, None on failure
    """
    if project is None or ref is None:
        return None
    assert isinstance(project, Project)
    assert isinstance(ref, ReleaseReference)
    for release in project.releases:
        if ref.releaseId == release.id or ref.name == release.name:
            return release
    else:
        return None

def find_build_by_reference(release, ref):
    """Find a build in a release using a build reference

    :param release: An instance of slickqaweb.model.release.Release to search in for the build
    :param ref: An instance of slickqaweb.model.buildReference.BuildReference
    :return: the build from the release on success, None on failure
    """
    if release is None or ref is None:
        return None
    assert isinstance(release, Release)
    assert isinstance(ref, BuildReference)
    for build in release.builds:
        if ref.buildId == build.id or ref.name == build.name:
            return build
    else:
        return None
