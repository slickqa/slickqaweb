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
    .controller('TestrunListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookies', '$location', 'UserService', function ($scope, rest, nav, $routeParams, $cookies, $location, user) {
        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];

        $scope.user = user.currentUser;
        $scope.editOn = false;


        if (!$routeParams["project"] && $cookies.get('slick-last-project-used')) {
            $location.search("project", $cookies.get('slick-last-project-used'));
        }
        $scope.$watch('project', function (newValue, oldValue) {
            if (newValue && oldValue !== newValue) {
                $location.search("project", newValue.name || newValue);
                $location.search("release", null);
                $location.search("testplanId", null);
            }
        });

        nav.setTitle("Testruns");
        rest.all('projects').getList().then(function (projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($routeParams["project"]) {
                $scope.project = _.find(projects, function (project) {
                    return $routeParams["project"] === project.name;
                });
                if ($scope.project) {
                    $scope.releases = $scope.project.releases;
                    if ($routeParams["release"]) {
                        $scope.release = _.find($scope.releases, function (release) {
                            return $routeParams["release"] === release.name;
                        });
                    }
                    $scope.$watch('release', function (newValue, oldValue) {
                        if (newValue) {
                            $location.search('release', newValue.name || newValue);
                        }
                    });
                    rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function (testplans) {
                        $scope.testplans = testplans;
                        if ($routeParams["testplanid"]) {
                            $scope.testplan = _.find($scope.testplans, function (testplan) {
                                return $routeParams["testplanid"] === testplan.id;
                            });
                        }
                        $scope.$watch('testplan', function (newValue, oldValue) {
                            if (newValue) {
                                $location.search("testplanid", newValue.id || newValue);
                            }
                        });
                    });
                }

            }
        });

        $scope.fetchTestruns = function (full) {
            var testrunQuery = [];
            if ($routeParams["project"] || $scope.project) {
                testrunQuery.push("eq(project.name,\"" + $routeParams["project"] + "\")");
            }
            if ($routeParams["release"] || $scope.release) {
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
            if (q == "") {
                if (full) {
                    rest.all('testruns').getList({orderby: '-dateCreated', limit: 525}).then(function (testruns) {
                        $scope.testruns = testruns;
                    });
                } else {
                    rest.all('testruns').getList({orderby: '-dateCreated', limit: 25}).then(function (testruns) {
                        $scope.testruns = testruns;
                        rest.all('testruns').getList({orderby: '-dateCreated', limit: 500, skip: 25}).then(function (therest) {
                            _.each(therest, function (testrun) {
                                $scope.testruns.push(testrun)
                            });
                        });
                    });
                }
            } else {
                if (full) {
                    rest.all('testruns').getList({q: q, limit: 525, orderby: '-dateCreated'}).then(function (testruns) {
                        $scope.testruns = testruns;
                    });
                } else {
                    rest.all('testruns').getList({q: q, limit: 25, orderby: '-dateCreated'}).then(function (testruns) {
                        $scope.testruns = testruns;
                        rest.all('testruns').getList({q: q, orderby: '-dateCreated', limit: 500, skip: 25}).then(function (therest) {
                            _.each(therest, function (testrun) {
                                $scope.testruns.push(testrun)
                            });
                        });
                    });
                }
            }
        };
        $scope.fetchTestruns(false);

        $scope.testrunList = {}; // Model for the list header and filter

        $scope.getDisplayName = function (testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.isEmpty = function (obj) {
            return _.isEmpty(obj);
        };

        $scope.toggleEdit = function () {
            $scope.editOn = !$scope.editOn;
        };

        $scope.deleteTestrun = function (testrun) {
            rest.one('testruns', testrun.id).remove().then(function () {
                $scope.fetchTestruns(true);
            })
        };

        window.scope = $scope;

    }])
    .controller('TestrunSummaryCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', '$cookies', '$mdDialog', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location, $cookies, $mdDialog) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.query = {
            order: 'name',
            limit: 25,
            page: 1
        };
        $scope.limitOptions = [25, 50, 100, 200];

        $scope.expandedResults = {};

        $scope.isExpanded = function (testcaseId) {
            return !!$scope.expandedResults[testcaseId];
        };

        $scope.statusToIcon = function (status) {
            switch (status) {
                case 'PASS':
                    return 'check_circle';
                case 'PASSED_ON_RETRY':
                    return 'check_circle';
                case 'FAIL':
                    return 'cancel';
                case 'BROKEN_TEST':
                    return 'error';
                case 'NO_RESULT':
                    return 'help';
                case 'SKIPPED':
                    return 'watch_later';
                case 'NOT_TESTED':
                    return 'pause_circle_filled';
            }
        };

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
        $scope.withoutNotesStats = {};
        $scope.options = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "none",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };
        if (!$cookies.getObject('testrunShowFilter')) {
            $cookies.putObject('testrunShowFilter', {
                author: true,
                component: false,
                recorded: true,
                duration: true,
                hostname: true,
                automationid: false,
                resultid: false
            });
        }
        $scope.show = $cookies.getObject('testrunShowFilter');

        $scope.testcases = {}

        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.showTestcase = false;
        $scope.showAddStep = false;

        $scope.testrunHistory = [];

        if ($routeParams.only) {
            $scope.filter[$routeParams.only] = true;
        }

        if ($routeParams.result) {
            $scope.resultList.searchField = {$: $routeParams.result};
        }

        $scope.repeatOffendersList = {};
        $scope.processingOffenders = true;
        $scope.topContributors = {};
        $scope.keyLength = function (obj) {
            return Object.keys(obj).length;
        }

        $scope.fetchTestrun = function () {
            rest.one('testruns', $routeParams["testrunid"]).get().then(function (testrun) {
                    $scope.testrun = testrun;
                    $scope.getTPSReportData();
                    $scope.data = new google.visualization.DataTable();
                    $scope.data.addColumn('string', 'Status');
                    $scope.data.addColumn('number', 'Results');
                    var emptyFilter = _.isEmpty($scope.filter);
                    if (emptyFilter) {
                        $scope.filter = {};
                    }
                    $scope.options.colors = [];
                    _.each(testrun.summary.statusListOrdered, function (status) {
                        $scope.data.addRow([replaceOnStatus(status, " "), testrun.summary.resultsByStatus[status]]);
                        $scope.options.colors.push(getStyle(replaceOnStatus(status, "") + "-element", "color"));
                        if (emptyFilter) {
                            $scope.filter[status] = status !== "PASS";
                            if ($routeParams.all) {
                                $scope.filter[status] = true;
                            }
                        }
                        if (status === "FAIL" || status === "BROKEN_TEST") {
                            rest.one('results', 'count').get({
                                "q": "and(eq(testrun__testrunId,\"" +
                                $routeParams["testrunid"] + "\"),eq(status,\"" + status +
                                "\"),ne(log__loggerName,\"slick.note\"))"
                            }).then(function (count) {
                                $scope.withoutNotesStats[status] = count;
                            });
                        }
                    });

                    $scope.recentlyFetchedTestrun = true;
                    $scope.testrunQuery(testrun.state);

                    if ($scope.results.length !== 0) {
                        if (Object.keys($scope.repeatOffendersList).length === 0 && Object.keys($scope.topContributors).length === 0) {
                            let repeatOffenders = {};
                            _.each($scope.results, function (result) {
                                if (result.status === "FAIL" || result.status === "BROKEN_TEST") {
                                    $scope.topContributors[result.testcase.author || "No Author"] = $scope.topContributors[result.testcase.author] + 1 || 1;
                                }
                                _.each(result.history, function (historyItem) {
                                    if (historyItem.status === "FAIL" || historyItem.status === "BROKEN_TEST") {
                                        repeatOffenders[historyItem.status] = repeatOffenders[historyItem.status] || {};
                                        repeatOffenders[historyItem.status][result.testcase.name] = repeatOffenders[historyItem.status][result.testcase.name] || {};
                                        repeatOffenders[historyItem.status][result.testcase.name]["status"] = historyItem.status;
                                        repeatOffenders[historyItem.status][result.testcase.name]["name"] = result.testcase.name;
                                        repeatOffenders[historyItem.status][result.testcase.name]["count"] = repeatOffenders[historyItem.status][result.testcase.name]["count"] + 1 || 1;
                                        repeatOffenders[historyItem.status][result.testcase.name]["testcases"] = repeatOffenders[historyItem.status][result.testcase.name]["testcases"] || [];
                                        repeatOffenders[historyItem.status][result.testcase.name]["testcases"].push(historyItem);
                                    }
                                });
                            });
                            _.each(repeatOffenders, function (status) {
                                _.each(status, function (testcase) {
                                    if (testcase.count > 4) {
                                        $scope.repeatOffendersList[testcase.status] = $scope.repeatOffendersList[testcase.status] || [];
                                        $scope.repeatOffendersList[testcase.status].push({name: testcase.name, count: testcase.count, testcases: testcase.testcases})
                                    }
                                });
                            });
                            $scope.processingOffenders = false;
                        }
                    }
                    nav.setTitle("Summary: " + $scope.getDisplayName(testrun));
                    $scope.goToBuildReportButton = {
                        href: `build-report/${testrun.project.name}/${testrun.release.name}/${testrun.build.name}`,
                        name: "Back to Build Report"
                    };
                    $scope.goToTPSReportButton = {
                        href: testrun.testplan ? `tps-report/${testrun.project.name}/${testrun.release.name}/${testrun.testplan.name}` : undefined,
                        name: "TPS Report"
                    };
                    $scope.estimatedTimeRemaining = testrun.state !== 'FINISHED' ? getEstimatedTimeRemaining(testrun, 'testrun') : "";

                    if (!testrun.info && testrun.project && testrun.release && testrun.build) {
                        projrest.one('projects', testrun.project.name).one('releases', testrun.release.name).one('builds', testrun.build.name).get().then(function (build) {
                            testrun.info = build.description;
                        });
                    }

                }
            );
        };

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.tpsReportOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "none",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };
        $scope.tpsData = new google.visualization.DataTable();
        $scope.tpsData.addColumn('string', 'Testrun Name');
        var refresh_promise;

        $scope.getTPSReportData = function () {
            rest.one('tps', $scope.testrun.project.name).one($scope.testrun.release.name, $scope.testrun.name).get().then(function (tpsreport) {
                $scope.tpsReportOptions = {
                    chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                    backgroundColor: "none",
                    legend: {
                        textStyle: {
                            color: "#ffffff"
                        },
                    },
                    vAxis: {
                        minValue: 0,
                        maxValue: 100,
                        format: '#\'%\''
                    },
                    lineWidth: 5,
                    colors: []
                };
                $scope.testrungroup = tpsreport;
                var testrungroup = tpsreport;
                if (tpsreport.hasOwnProperty('name')) {
                    $scope.testrunHistory = [];
                    $scope.tpsData = new google.visualization.DataTable();
                    $scope.tpsData.addColumn('date', 'Recorded');
                    _.sortBy($scope.testruns, function (testrun) {
                        return testrun.dateCreated;
                    });
                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                        $scope.tpsReportOptions.colors.push(color);
                        $scope.tpsData.addColumn('number', replaceOnStatus(status, " "))
                    });
                    _.each(testrungroup.testruns, function (testrun, index) {
                        $scope.testrunHistory.unshift(testrun)
                        var row = [new Date(testrun.dateCreated)];
                        let sum = Object.values(testrun.summary.resultsByStatus).reduce((a, b) => a + b, 0);
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status] / sum * 100);
                        });
                        $scope.tpsData.addRow(row);
                        $scope.tpsData.setRowProperties(index, {testrun: testrun.id});
                    });
                } else {
                    refresh_promise = $timeout($scope.getTPSReportData, 15000);
                }
            }, function errorCallback() {
                refresh_promise = $timeout($scope.getTPSReportData, 3000);
            });
        };

        $scope.resultGraphs = {};

        $scope.getGraphDataFromResult = function (result) {
            let reportOptions = {
                title: result.testcase.name,
                chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                backgroundColor: "none",
                hAxis: {
                    title: 'Time',
                    titleTextStyle: {
                        color: "#ffffff"
                    },
                    textStyle: {
                        color: "#ffffff"
                    }
                },
                vAxis: {
                    title: 'Values',
                    textStyle: {
                        color: "#ffffff"
                    },
                    titleTextStyle: {
                        color: "#ffffff"
                    }
                },
                legend: {
                    textStyle: {
                        color: "#ffffff"
                    },
                },
                lineWidth: 5,
            };
            let reportData = new google.visualization.DataTable();
            _.each(result.graph.columns, function (column) {
                reportData.addColumn(column.type, column.name)
            });
            _.each(result.graph.values, function (value) {
                let row = [new Date(value.date)];
                _.each(value.measurements, function (measurement) {
                    row.push(measurement);
                });
                reportData.addRow(row);
            });
            $scope.resultGraphs[result.id] = {options: reportOptions, data: reportData}
        };

        $scope.fetchTestrun();

        $scope.testrunQuery = function (state) {
            var oldQuery = $scope.resultQuery.q;
            var includableStatuses = _.filter(_.keys($scope.filter), function (key) {
                return $scope.filter[key] && key !== 'withoutnotes'
            });
            var andQuery = ["eq(testrun__testrunId,\"" + $routeParams["testrunid"] + "\")"];
            if (includableStatuses.length === 1) {
                andQuery.push("eq(status,\"" + includableStatuses[0] + "\")")
            } else if (includableStatuses.length > 1) {
                var statuses = [];
                _.each(includableStatuses, function (status) {
                    statuses.push("eq(status,\"" + status + "\")");
                });
                andQuery.push("or(" + statuses.join(',') + ")")
            }
            if ($scope.filter['withoutnotes']) {
                andQuery.push('ne(log__loggerName,"slick.note")')
            }
            $scope.resultQuery = {
                q: "and(" + andQuery.join(',') + ")"
            };
            if (oldQuery != $scope.resultQuery.q || $scope.recentlyFetchedTestrun) {
                rest.all('results').getList($scope.resultQuery).then(function (results) {
                    $scope.results = [];
                    //$scope.results = results;
                    _.each(results, function (result) {
                        if (result.started) {
                            result.recorded = result.started;
                        }
                        if (result.graph) {
                            $scope.getGraphDataFromResult(result)
                        }
                        $scope.results.push(result);
                    });
                    $scope.recentlyFetchedTestrun = false;
                    if (state !== "FINISHED") {
                        $timeout($scope.fetchTestrun, 5000);
                    }
                });
            }
        };

        $scope.getDisplayName = function (testrun) {
            var retval = testrun.name;
            if (testrun.testplan) {
                retval = testrun.testplan.name;
            }
            return retval;
        };

        $scope.toggleFilter = function (status) {
            $scope.filter[status] = !$scope.filter[status];
            $scope.statusFilter.$setDirty();
        };

        $scope.getTestrunDuration = function (testrun) {
            return getDurationString(testrun.runFinished - testrun.runStarted);
        };

        $scope.getResultDuration = function (result, raw) {
            if (result.runlength) {
                if (raw) {
                    return result.runlength;
                }
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                if (raw) {
                    return result.finished - result.started
                }
                return getDurationString(result.finished - result.started);
            }
        };

        $scope.$watch('statusFilter.$dirty', function (newValue, oldValue) {
            $scope.testrunQuery();
            $scope.statusFilter.$setPristine();
        });
        $scope.$watch('showFilter.$dirty', function (newValue, oldValue) {
            if (newValue) {
                $cookies.putObject('testrunShowFilter', $scope.show);
                $scope.showFilter.$setPristine();
            }
        });

        $scope.getAbbreviatedReason = function (result) {
            if (result.reason) {
                var line = result.reason.split("\n")[0];
                return line;
            } else {
                return "";
            }
        };

        $scope.getImages = function (result) {
            return _.filter(result.files, function (file) {
                return /^image/.test(file.mimetype);
            });
        };

        $scope.addMoreDetail = function (result, $event) {
            $scope.moreDetailForResult[result.id] = true;
        };

        $scope.removeDetail = function (result, $event) {
            $scope.moreDetailForResult[result.id] = false;
        };

        $scope.addNote = function (result, $event) {
            $scope.note.result = result;
            $scope.showAddNote = true;
        };

        $scope.addNoteDialogButtonClicked = function (buttonName) {
            if (buttonName == "Add") {
                var result = $scope.note.result;
                var note = $scope.note;
                var logEntry = {
                    entryTime: new Date().getTime(),
                    level: "WARN",
                    loggerName: "slick.note",
                    message: note.message,
                    exceptionMessage: note.externalLink
                };
                rest.one('results', result.id).post('log', logEntry).then(function (numOfLogEntries) {
                    if (!result.log) {
                        result.log = [];
                    }
                    result.log.push(logEntry);
                });
                if (note.recurring) {
                    rest.one('testcases', result.testcase.testcaseId).get().then(function (testcase) {
                        if (!testcase.activeNotes) {
                            testcase.activeNotes = []
                        }
                        var recurringNote = {message: note.message};
                        if (note.url) {
                            recurringNote.url = note.url;
                        }
                        if (note.matchRelease) {
                            recurringNote.release = result.release;
                        }
                        if (note.matchEnvironment) {
                            recurringNote.environment = result.config;
                        }
                        testcase.activeNotes.push(recurringNote);
                        testcase.put();
                    });
                }
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

        $scope.getResultNotes = function (result) {
            return _.filter(result.log, function (logEntry) {
                return (logEntry.level === "WARN" || logEntry.level === "INFO") && logEntry.loggerName === "slick.note";
            });
        };

        $scope.displayFile = function (file, $event) {
            $scope.fileToDisplay = file;
            $scope.showDisplayFile = true;
            $event.preventDefault();
            if (file && file.mimetype && (file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml")) {
                rest.one('files', file.id).one('content', file.filename).get().then(function (text) {
                    $scope.fileToDisplay.text = text;
                });
            }
        };

        $scope.getFileViewer = function (file) {
            if (file && file.mimetype) {
                if (file.mimetype.indexOf("image") === 0) {
                    return "image";
                } else if (file.mimetype.indexOf("video") === 0) {
                    if (file.mimetype == "video/mp4") {
                        return "html5-video";
                    } else {
                        return "embed-video";
                    }
                } else if (file.mimetype.indexOf("text/") >= 0 || file.mimetype == "application/xml") {
                    return "text";
                }

            }
        };

        $scope.showTestcase = function (testcaseId, $event) {
            $event.preventDefault();
            rest.one('testcases', testcaseId).get().then(function (testcase) {
                $scope.expandedResults[testcase.name] = $scope.expandedResults[testcase.name] ? !$scope.expandedResults[testcase.name] : true;
                $scope.testcase = testcase;
                $scope.testcases[testcase.name] = testcase
            });
        };

        $scope.getUrlForFile = function (file) {
            return "api/files/" + file.id + "/content/" + file.filename;
        };

        $scope.displayFileDialogButtonClicked = function (buttonName) {
            $scope.showDisplayFile = false;
            $scope.fileToDisplay = {};
        };

        $scope.displayReason = function (result, $event) {
            $event.preventDefault();
            $scope.showDisplayReason = true;
            $scope.reason = result.reason;
        };

        $scope.displayReasonDialogButtonClicked = function (buttonName) {
            $scope.showDisplayReason = false;
            $scope.reason = "";
        };

        $scope.displayLogs = function (result, $event) {
            $event.preventDefault();
            $scope.logs = result.log;
            $scope.showDisplayLogs = true;
        };

        $scope.displayLogsDialogButtonClicked = function (buttonName) {
            $scope.logs = [];
            $scope.showDisplayLogs = false;
        };

        $scope.displayTestcaseDialogButtonClicked = function (buttonName) {
            $scope.showTestcaseDialog = false;
            $scope.testcase = {
                name: "",
                purpose: ""
            };
        };

        $scope.onHistoryClick = function (history) {
            rest.one('results', history.resultId).get().then(function (result) {
                $location.path('testruns/' + result.testrun.testrunId);
                if (result.status == "PASS") {
                    $location.search({result: result.id, all: "true"});
                } else {
                    $location.search({result: result.id});
                }
            });
        };

        $scope.cancelResults = function () {
            rest.one('testruns', $scope.testrun.id).one('cancel').get();
        };

        $scope.rescheduleStatus = function (status_name) {
            rest.one('testruns', $scope.testrun.id).one('reschedule', status_name).get();
        };

        $scope.rescheduleResult = function (result_id) {
            rest.one('results', result_id).one('reschedule').get();
        };

        window.scope = $scope;
    }]);


