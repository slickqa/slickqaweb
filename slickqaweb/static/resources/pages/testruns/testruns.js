/**
 * User: jcorbett
 * Date: 11/24/13
 * Time: 10:15 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testruns', {
                templateUrl: 'static/resources/pages/testruns/testrun-list.html',
                controller: 'TestrunListCtrl'
            })
            .when('/testruns/:testrunid', {
                templateUrl: 'static/resources/pages/testruns/testrun-summary.html',
                controller: 'TestrunSummaryCtrl'
            });
        nav.addLink('Reports', 'Testruns', 'testruns');
    }])
    .controller('TestrunListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookieStore', '$location', function ($scope, rest, nav, $routeParams, $cookieStore, $location) {
        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];


        if (!$routeParams["project"] && $cookieStore.get('slick-last-project-used')) {
            $location.search("project", $cookieStore.get('slick-last-project-used'));
        }
        $scope.$watch('project', function (newValue, oldValue) {
            if (newValue && oldValue != newValue) {
                $location.search("project", newValue.name);
                $location.search("release", null);
                $location.search("testplanId", null);
            }
        });

        nav.setTitle("Testruns");
        rest.all('projects').getList().then(function(projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($routeParams["project"]) {
                $scope.project = _.find(projects, function(project) {
                    return $routeParams["project"] == project.name;
                });
                if ($scope.project) {
                    $scope.releases = $scope.project.releases;
                    if ($routeParams["release"]) {
                        $scope.release = _.find($scope.releases, function(release) {
                            return $routeParams["release"] == release.name;
                        });
                    }
                    $scope.$watch('release', function (newValue, oldValue) {
                        if(newValue) {
                            $location.search('release', newValue.name);
                        }
                    });
                    rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function(testplans) {
                        $scope.testplans = testplans;
                        if ($routeParams["testplanid"]) {
                            $scope.testplan = _.find($scope.testplans, function(testplan) {
                                return $routeParams["testplanid"] == testplan.id;
                            });
                        }
                        $scope.$watch('testplan', function(newValue, oldValue) {
                            if (newValue) {
                                $location.search("testplanid", newValue.id);
                            }
                        });
                    });
                }

            }
        });

        var testrunQuery = [];
        if ($routeParams["project"]) {
            testrunQuery.push("eq(project.name,\"" + $routeParams["project"] + "\")");
        }
        if ($routeParams["release"]) {
            testrunQuery.push("eq(release.name,\"" + $routeParams["release"] + "\")");
        }
        if ($routeParams["testplanid"]) {
            testrunQuery.push("eq(testplanId,\"" + $routeParams["testplanid"] + "\")");
        }

        var q = "";
        if (testrunQuery.length > 1) {
            q = "and(";
        }
        q = q + testrunQuery.join();
        if (testrunQuery.length > 1) {
            q = q + ")";
        }
        if (!q) {
            rest.all('testruns').getList({orderby: '-dateCreated', limit: 25}).then(function(testruns) {
                $scope.testruns = testruns;
                rest.all('testruns').getList({orderby: '-dateCreated', limit: 500, skip: 25}).then(function(therest) {
                    _.each(therest, function(testrun) { $scope.testruns.push(testrun)});
                });
            });
        } else {
            rest.all('testruns').getList({q: q, limit: 25, orderby: '-dateCreated'}).then(function(testruns) {
                $scope.testruns = testruns;
                rest.all('testruns').getList({q: q, orderby: '-dateCreated', limit: 500, skip: 25}).then(function(therest) {
                    _.each(therest, function(testrun) { $scope.testruns.push(testrun)});
                });
            });
        }
        $scope.testrunList = {}; // Model for the list header and filter

        $scope.getDisplayName = function(testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

    }])
    .controller('TestrunSummaryCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location) {
        $scope.testrun = {};
        $scope.results = [];
        $scope.filter = {};
        $scope.resultQuery = {};
        $scope.resultList = {};
        $scope.moreDetailForResult = {};
        $scope.moreDetail = false;
        $scope.data = new google.visualization.DataTable();
        $scope.data.addColumn('string', 'Status');
        $scope.data.addColumn('number', 'Results');
        $scope.showAddNote = false;
        $scope.note = {
            result: null,
            message: '',
            externalLink: '',
            recurring: false,
            matchRelease: true,
            matchEnvironment: true
        };
        $scope.showDisplayFile = false;
        $scope.fileToDisplay = {};
        $scope.reason = "";
        $scope.showDisplayReason = false;
        $scope.logs = [];
        $scope.showDisplayLogs = false;
        $scope.recentlyFetchedTestrun = false;
        $scope.options = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };

        if ($routeParams.only) {
            $scope.filter[$routeParams.only] = true;
        }

        if ($routeParams.result) {
            $scope.resultList.searchField = { $: $routeParams.result };
        }

        $scope.fetchTestrun = function() {
            rest.one('testruns', $routeParams["testrunid"]).get().then(function(testrun) {
                $scope.testrun = testrun;
                $scope.data = new google.visualization.DataTable();
                $scope.data.addColumn('string', 'Status');
                $scope.data.addColumn('number', 'Results');
                var emptyFilter = _.isEmpty($scope.filter);
                if (emptyFilter) {
                    $scope.filter = {};
                }
                $scope.options.colors = [];
                _.each(testrun.summary.statusListOrdered, function(status) {
                    $scope.data.addRow([status.replace("_", " "), testrun.summary.resultsByStatus[status]]);
                    $scope.options.colors.push(getStyle(status.replace("_", "") + "-element", "color"));
                    if (emptyFilter) {
                        $scope.filter[status] = status != "PASS";
                        if ($routeParams.all) {
                            $scope.filter[status] = true;
                        }
                    }
                });

                $scope.recentlyFetchedTestrun = true;
                $scope.testrunQuery();
                nav.setTitle("Summary: " + $scope.getDisplayName(testrun));

                if(testrun.state != "FINISHED") {
                    $timeout($scope.fetchTestrun, 3000);
                }

                if(!testrun.info && testrun.project && testrun.release && testrun.build) {
                    projrest.one('projects', testrun.project.name).one('releases', testrun.release.name).one('builds', testrun.build.name).get().then(function(build) {
                        testrun.info = build.description;
                    });
                }

            });
        };

        $scope.fetchTestrun();

        $scope.testrunQuery = function() {
            var oldQuery = $scope.resultQuery.q;
            var includableStatuses = _.filter(_.keys($scope.filter), function(key) { return $scope.filter[key]});
            if(includableStatuses.length == 1) {
                $scope.resultQuery = {
                    q: "and(eq(testrun.testrunId,\"" + $routeParams["testrunid"] + "\"),eq(status,\"" + includableStatuses[0] + "\"))",
                };
            } else {
                var statuses = [];
                _.each(includableStatuses, function(status) {
                    statuses.push("eq(status,\"" + status + "\")");
                });
                $scope.resultQuery = {
                    q: "and(eq(testrun.testrunId,\"" + $routeParams["testrunid"] + "\"),or(" + statuses.join(",") + "))",
                }
            }
            if (oldQuery != $scope.resultQuery.q || $scope.recentlyFetchedTestrun) {
                rest.all('results').getList($scope.resultQuery).then(function(results) {
                    $scope.results = results;
                    $scope.recentlyFetchedTestrun = false;
                });
            }
        };

        $scope.getDisplayName = function(testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.toggleFilter = function(status) {
            $scope.filter[status] = ! $scope.filter[status];
            $scope.statusFilter.$setDirty();
        };

        $scope.getTestrunDuration = function(testrun) {
            return getDurationString(testrun.runFinished - testrun.runStarted);
        };

        $scope.getResultDuration = function(result) {
            if (result.runlength) {
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                return getDurationString(result.finished - result.started);
            }
        };

        $scope.$watch('statusFilter.$dirty', function(newValue, oldValue) {
            $scope.testrunQuery();
            $scope.statusFilter.$setPristine();
        });

        $scope.getAbbreviatedReason = function(result) {
            if (result.reason) {
                var line = result.reason.split("\n")[0];
                return line;
            } else {
                return "";
            }
        };

        $scope.getImages = function(result) {
            return _.filter(result.files, function(file) { return /^image/.test(file.mimetype);});
        };

        $scope.addMoreDetail = function(result) {
            $scope.moreDetailForResult[result.id] = true;
        };

        $scope.removeDetail = function(result) {
            $scope.moreDetailForResult[result.id] = false;
        };

        $scope.addNote = function(result) {
            $scope.note.result = result;
            $scope.showAddNote = true;
        };

        $scope.addNoteDialogButtonClicked = function(buttonName) {
            if (buttonName == "Add") {
                var result = $scope.note.result;
                var logEntry = {
                    entryTime: new Date().getTime(),
                    level: "WARN",
                    loggerName: "slick.note",
                    message: $scope.note.message,
                    exceptionMessage: $scope.note.externalLink
                };
                rest.one('results', result.id).post('log',logEntry).then(function(numOfLogEntries) {
                    if (!result.log) {
                        result.log = [];
                    }
                    result.log.push(logEntry);
                });
            }
            $scope.showAddNote = false;
            $scope.note = {
                result: null,
                message: '',
                externalLink: '',
                recurring: false,
                matchRelease: true,
                matchEnvironment: true
            };
        };

        $scope.getResultNotes = function(result) {
            return _.filter(result.log, function(logEntry) {
                return logEntry.level == "WARN" && logEntry.loggerName == "slick.note";
            });
        };

        $scope.displayFile = function(file, $event) {
            $scope.fileToDisplay = file;
            $scope.showDisplayFile = true;
            $event.preventDefault();
            if(file && file.mimetype && (file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml")) {
                rest.one('files', file.id).one('content', file.filename).get().then(function(text) {
                    $scope.fileToDisplay.text = text;
                });
            }
        };

        $scope.getFileViewer = function(file) {
            if(file && file.mimetype) {
                if (file.mimetype.indexOf("image") === 0) {
                    return "image";
                } else if(file.mimetype.indexOf("video") === 0) {
                    if (file.mimetype == "video/mp4") {
                        return "html5-video";
                    } else {
                        return "embed-video";
                    }
                } else if(file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml") {
                    return "text";
                }

            }
        };

        $scope.getUrlForFile = function(file) {
            return "api/files/" + file.id + "/content/" + file.filename;
        };

        $scope.displayFileDialogButtonClicked = function(buttonName) {
            $scope.showDisplayFile = false;
            $scope.fileToDisplay = {};
        };

        $scope.displayReason = function(result, $event) {
            $event.preventDefault();
            $scope.showDisplayReason = true;
            $scope.reason = result.reason;
        };

        $scope.displayReasonDialogButtonClicked = function(buttonName) {
            $scope.showDisplayReason = false;
            $scope.reason = "";
        };

        $scope.displayLogs = function(result, $event) {
            $event.preventDefault();
            $scope.logs = result.log;
            $scope.showDisplayLogs = true;
        };

        $scope.displayLogsDialogButtonClicked = function(buttonName) {
            $scope.logs = [];
            $scope.showDisplayLogs = false;
        };

        $scope.onHistoryClick = function(history) {
            rest.one('results', history.resultId).get().then(function(result) {
                $location.path('testruns/' + result.testrun.testrunId);
                if (result.status == "PASS") {
                    $location.search({result: result.id, all: "true"});
                } else {
                    $location.search({result: result.id});
                }
            });
        };

        window.scope = $scope;
    }]);


