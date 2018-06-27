/**
 * User: jcorbett
 * Date: 11/24/13
 * Time: 10:15 PM
 */

angular.module('slickApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/result-list/:project/:release/:build*', {
                templateUrl: 'static/resources/pages/result-list/result-list.html',
                controller: 'ResultListCtrl'
            })
    }])
    .controller('ResultListCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', 'NameBasedRestangular', '$location', function ($scope, rest, nav, $routeParams, $timeout, projrest, $location) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.results = [];
        $scope.filter = {};
        $scope.resultQuery = {};
        $scope.resultList = {};
        $scope.moreDetailForResult = {};
        $scope.moreDetail = false;
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

        $scope.testcase = {
            name: "",
            purpose: ""
        };

        $scope.showTestcase = false;
        $scope.showAddStep = false;
        var title = "FAILED and BROKEN";
        var statusQuery = 'or(eq(status,"FAIL"),eq(status,"BROKEN_TEST"))';
        if ($routeParams['status']) {
            var statusList = $routeParams['status'].split(",");
            title = statusList.join(", ").replace(/,([^,]*)$/,' & '+'$1').replace(/_/g, " ");
            if (statusList.length > 1) {
                var finalList = [];
                for (var i = 0; i < statusList.length; i++) {
                    finalList.push('eq(status,"' + statusList[i] + '")');
                }
                statusQuery = 'or(' + finalList.join(",") + ')';
            } else {
                statusQuery = 'eq(status,"' + statusList[0] + '")'
            }

        }

        nav.setTitle(title + " results for " + $routeParams['project'] + " " + $routeParams['release'] + "." + $routeParams['build']);

        rest.one('projects', $routeParams['project']).get().then(function (project) {
            rest.one('projects', $routeParams['project']).one('releases', $routeParams['release']).get().then(function (release) {
                rest.one('projects', $routeParams['project']).one('releases', $routeParams['release']).one('builds', $routeParams['build']).get().then(function (build) {
                    rest.all('results').getList({q: 'and(eq(project.id,"' + project.id + '"),' + 'eq(release.releaseId,"' + release.id + '"),eq(build.buildId,"' + build.id + '"),' + statusQuery + ')'}).then(function(results) {
                        $scope.results = [];
                        //$scope.results = results;
                        _.each(results, function(result) {
                            if(result.started) {
                                result.recorded = result.started;
                            }
                            $scope.results.push(result);
                        });
                    });

                });
            });
        });


        $scope.getResultDuration = function(result) {
            if (result.runlength) {
                return getDurationString(result.runlength);
            }
            if (result.started && result.finished) {
                return getDurationString(result.finished - result.started);
            }
        };

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
                var note = $scope.note;
                var logEntry = {
                    entryTime: new Date().getTime(),
                    level: "WARN",
                    loggerName: "slick.note",
                    message: note.message,
                    exceptionMessage: note.externalLink
                };
                rest.one('results', result.id).post('log',logEntry).then(function(numOfLogEntries) {
                    if (!result.log) {
                        result.log = [];
                    }
                    result.log.push(logEntry);
                });
                if (note.recurring) {
                    rest.one('testcases', result.testcase.testcaseId).get().then(function(testcase) {
                        if (! testcase.activeNotes) {
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

        $scope.getResultNotes = function(result) {
            return _.filter(result.log, function(logEntry) {
                return (logEntry.level === "WARN" || logEntry.level === "INFO") && logEntry.loggerName === "slick.note";
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

        $scope.showTestcase = function(testcaseId, $event) {
            $event.preventDefault();
            rest.one('testcases', testcaseId).get().then(function(testcase) {
                $scope.testcase = testcase;
                $scope.showTestcaseDialog = true;
            });
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

        $scope.displayTestcaseDialogButtonClicked = function(buttonName) {
            $scope.showTestcaseDialog = false;
            $scope.testcase = {
                name: "",
                purpose: ""
            };
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

        $scope.cancelResults = function () {
            rest.one('testruns', $scope.testrun.id).one('cancel').get();
        };
        
        $scope.rescheduleStatus = function(status_name) {
            rest.one('testruns', $scope.testrun.id).one('reschedule', status_name).get();
        };
        
        $scope.rescheduleResult = function(result_id) {
            rest.one('results', result_id).one('reschedule').get();
        };

        window.scope = $scope;
    }]);


