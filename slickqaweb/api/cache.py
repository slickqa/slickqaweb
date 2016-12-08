
from werkzeug.contrib.cache import SimpleCache

from slickqaweb.api.project import get_project, get_release, get_build

cache = SimpleCache()


def get_project_release_build_ids(project_name, release_name, build_name):
    retval = []
    project = None
    release = None
    build = None

    if project_name is None:
        retval.append(None)
    else:
        cache_key = "project-{}".format(project_name)
        if cache.has(cache_key):
            retval.append(cache.get(cache_key))
        else:
            project = get_project(project_name)
            if project is not None:
                retval.append(project.id)
                cache.set(cache_key, project.id)
            else:
                retval.append(None)

    if release_name is None:
        retval.append(None)
    else:
        cache_key = "release-{}".format(release_name)
        if cache.has(cache_key):
            retval.append(cache.get(cache_key))
        else:
            if project is not None:
                release = get_release(project, release_name)
            if release is not None:
                retval.append(release.id)
                cache.set(cache_key, release.id)
            else:
                retval.append(None)

    if build_name is None:
        retval.append(None)
    else:
        cache_key = "build-{}".format(build_name)
        if cache.has(cache_key):
            retval.append(cache.get(cache_key))
        else:
            if release is not None:
                build = get_build(release, build_name)
            if build is not None:
                retval.append(build.id)
                cache.set(cache_key, build.id)
            else:
                retval.append(None)

    return retval
