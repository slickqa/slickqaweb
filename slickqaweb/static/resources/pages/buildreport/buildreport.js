/**
 * Created by jcorbett on 2/2/14.
 */


angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/build-report/:project/:release/:build*', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewBuildReportCtrl'
            })
            .when('/build-report/:project/:release', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewBuildReportCtrl'
            });
    }])
    .controller('ViewBuildReportCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        try {
            $scope.environment = environment;
        } catch (e) {
            //    Don't log again but still catch.
        }

        $scope.replaceOnStatus = replaceOnStatus;
        $scope.statusToIcon = statusToIcon;

        $scope.query = {
            order: 'dateCreated',
            limit: 25,
            page: 1
        };
        $scope.setOrder = function (order) {
            $scope.query.order = order;
        };
        $scope.limitOptions = [25, 50, 100, 200];
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.editbutton = {
            href: "result-list/" + $routeParams['project'] + "/" + $routeParams['release'] + "/" + $routeParams['build'],
            name: "Broken and Failed Results"
        };
        $scope.releaseReportButton = {
            href: "release-report/" + $routeParams['project'] + "/" + $routeParams['release'],
            name: "Release Report"
        };

        $scope.parallelSummaryData = new google.visualization.DataTable();
        $scope.parallelSummaryData.addColumn('string', 'Status');
        $scope.parallelSummaryData.addColumn('number', 'Results');

        $scope.parallelIndividualData = new google.visualization.DataTable();
        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


        $scope.summaryChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };

        $scope.individualChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
            backgroundColor: "#000000",
            isStacked: true,
            legend: 'none',
            hAxis: {
                textStyle: {
                    color: '#ffffff'
                },
                slantedText: true
            },
            colors: []
        };

        var refresh_promise;

        let focused = true;

        window.onfocus = function () {
            focused = true;
        };

        window.onblur = function () {
            focused = false;
        };

        $scope.getBuildReportData = function () {
            if (focused) {
                if ($routeParams.release === 'latest') {
                    rest.all('testruns').getList({orderby: '-runStarted', limit: 5, 'project.name': $routeParams['project']}).then(function (testruns) {
                        let goldenTestrun = _.find(testruns, function (testrun) {
                            return angular.isDefined(testrun.build.name)
                        });
                        if (angular.isDefined(goldenTestrun)) {
                            $routeParams.release = goldenTestrun.release.name;
                            $routeParams.build = goldenTestrun.build.name;
                        } else {
                            rest.one('projects', $routeParams['project']).get().then(function (project) {
                                let lastRelease = project.releases.length - 1;
                                $routeParams.release = project.releases[lastRelease]['name'];
                                let lastBuild = project.releases[lastRelease]['builds'].length - 1;
                                $routeParams.build = project.releases[lastRelease]['builds'][lastBuild]['name']
                            });
                        }
                    });
                } else if ($routeParams.build === 'latest') {
                    rest.all('testruns').getList({orderby: '-runStarted', limit: 5, 'project.name': $routeParams['project'], 'release.name': $routeParams.release}).then(function (testruns) {
                        let goldenTestrun = _.find(testruns, function (testrun) {
                            return angular.isDefined(testrun.build.name)
                        });
                        if (angular.isDefined(goldenTestrun)) {
                            $routeParams.release = goldenTestrun.release.name;
                            $routeParams.build = goldenTestrun.build.name;
                        } else {
                            rest.one('projects', $routeParams['project']).get().then(function (project) {
                                let release = null;
                                for (let i = 0; i < project.releases.length; i++) {
                                    if (project.releases[i]['name'] === $routeParams.release) {
                                        release = project.releases[i];
                                        break;
                                    }
                                }
                                if (release !== null) {
                                    let lastBuild = project.releases[i]['builds'].length - 1;
                                    $routeParams.build = release['builds'][lastBuild]['name']
                                }
                            });
                        }
                    });
                }
                rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).get().then(function (buildreport) {
                    $scope.summaryChartOptions = {
                        chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
                        backgroundColor: "none",
                        pieSliceBorderColor: "none",
                        legend: 'none',
                        colors: []
                    };

                    $scope.individualChartOptions = {
                        chartArea: {left: '5%', top: '5%', width: '90%', height: '70%'},
                        backgroundColor: "none",
                        isStacked: true,
                        legend: 'none',
                        hAxis: {
                            textStyle: {
                                color: '#c0c0c0'
                            },
                            slantedText: true
                        },
                        colors: []
                    };
                    $scope.routeParams = $routeParams;
                    $scope.testrungroup = buildreport;
                    $scope.estimatedTimeRemaining = "";
                    $scope.buildRunTime = "";
                    $scope.testRunsTitle = "Testruns";
                    $scope.isBuildReport = false;
                    var testrungroup = buildreport;
                    if (buildreport.hasOwnProperty('name')) {
                        nav.setTitle(buildreport.name);
                        let finishedRunTimes = [];
                        for (let key in buildreport.testruns) {
                            if (buildreport.testruns[key].hasOwnProperty('runFinished')) {
                                finishedRunTimes.push(buildreport.testruns[key].runFinished)
                            }
                        }
                        $scope.estimatedTimeRemaining = getEstimatedTimeRemaining(buildreport, 'build');
                        $scope.isBuildReport = true;
                        let createdTime = buildreport.testruns[0].dateCreated;
                        if (finishedRunTimes.length === buildreport.testruns.length || $scope.estimatedTimeRemaining === "") {
                            $scope.buildRunTime = finishedRunTimes.length !== 0 ? getDurationString(Math.max(...finishedRunTimes) - createdTime, true) : "";
                        } else {
                            $scope.buildRunTime = getDurationString(new Date().getTime() - createdTime, true);
                        }
                        $scope.parallelSummaryData = new google.visualization.DataTable();
                        $scope.parallelSummaryData.addColumn('string', 'Status');
                        $scope.parallelSummaryData.addColumn('number', 'Results');

                        $scope.parallelIndividualData = new google.visualization.DataTable();
                        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

                        refresh_promise = $timeout($scope.getBuildReportData, 3000);
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            $scope.parallelSummaryData.addRow([replaceOnStatus(status, " "), testrungroup.groupSummary.resultsByStatus[status]]);
                            var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                            $scope.summaryChartOptions.colors.push(color);
                            $scope.individualChartOptions.colors.push(color);

                            $scope.parallelIndividualData.addColumn('number', replaceOnStatus(status, " "))
                        });

                        _.each(testrungroup.testruns, function (testrun) {
                            var row = [testrun.name];
                            _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                                row.push(testrun.summary.resultsByStatus[status]);
                            });
                            $scope.parallelIndividualData.addRow(row);
                        });
                    } else {
                        refresh_promise = $timeout($scope.getBuildReportData, 500);
                    }
                }, function errorCallback() {
                    refresh_promise = $timeout($scope.getBuildReportData, 3000);
                });
            } else {
                refresh_promise = $timeout($scope.getBuildReportData, 500);
            }
        };

        $scope.buildHistory = [];

        $scope.releaseReportOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "none",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };

        let params = {limit: "15", groupType: "PARALLEL"};
        if ($routeParams["limit"]) {
            params.limit = $routeParams["limit"];
        }

        $scope.releaseData = new google.visualization.DataTable();
        $scope.releaseData.addColumn('string', 'Build Name');
        $scope.getReleaseData = function () {
            if (focused) {
                rest.one('release-report', $routeParams.project).one($routeParams.release).get(params).then(function (releaseReport) {
                    $scope.releaseReportOptions = {
                        chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                        backgroundColor: "none",
                        vAxis: {
                            minValue: 0,
                            maxValue: 100,
                            format: '#\'%\''
                        },
                        lineWidth: 5,
                        legend: {
                            textStyle: {
                                color: "#ffffff"
                            }
                        },
                        colors: []
                    };
                    if (releaseReport.hasOwnProperty('name')) {
                        $scope.buildHistory = [];
                        $scope.releaseData = new google.visualization.DataTable();
                        $scope.releaseData.addColumn('date', 'Recorded');
                        let gotXAndY = false;
                        refresh_promise = $timeout($scope.getReleaseData, 3000);
                        _.each(releaseReport.builds.sort(function (a, b) {
                            return (a.testruns[0].dateCreated > b.testruns[0].dateCreated) ? 1 : ((b.testruns[0].dateCreated > a.testruns[0].dateCreated) ? -1 : 0);
                        }), function (build, index) {
                            $scope.buildHistory.unshift(build);
                            let row = [new Date(build.testruns[0].dateCreated)];
                            let sum = Object.values(build.groupSummary.resultsByStatus).reduce((a, b) => a + b, 0);
                            if (!gotXAndY) {
                                _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                    let color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                                    $scope.releaseReportOptions.colors.push(color);
                                    $scope.releaseData.addColumn('number', replaceOnStatus(status, " "));
                                });
                                gotXAndY = true;
                                // $scope.releaseData.addColumn('string', 'Build');
                            }
                            _.each(Object.keys(build.groupSummary.resultsByStatus).sort(), function (status) {
                                row.push(build.groupSummary.resultsByStatus[status] / sum * 100);
                            });
                            // row.push(`${build.testruns[0].project.name}/${build.testruns[0].release.name}/${build.testruns[0].build.name}`);
                            $scope.releaseData.addRow(row);
                            $scope.releaseData.setRowProperties(index, {project: build.testruns[0].project.name, release: build.testruns[0].release.name, build: build.testruns[0].build.name})
                        });
                    } else {
                        refresh_promise = $timeout($scope.getReleaseData, 500);
                    }
                }, function errorCallback() {
                    refresh_promise = $timeout($scope.getReleaseData, 3000);
                },);
            } else {
                refresh_promise = $timeout($scope.getReleaseData, 500);
            }
        };

        $scope.getBuildReportData();

        $scope.getReleaseData();

        $scope.getResults = function (state) {
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
                        $scope.results.push(result);
                    });
                    $scope.recentlyFetchedTestrun = false;
                    if (state !== "FINISHED") {
                        $timeout($scope.fetchTestrun, 5000);
                    }
                });
            }
        };

        $scope.cancelResultsForBuild = function (testrungroupId) {
            if (testrungroupId) {
                rest.one('testrungroups', testrungroupId).one('cancel').get();
            } else {
                rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).one('cancel').get();
            }
        };

        $scope.rescheduleStatusForBuild = function (status_name) {
            rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).one('reschedule', status_name).get();
        };

        $scope.$on('$destroy', function () {
            $scope.stopRefresh();
        });

        $scope.stopRefresh = function () {
            if (angular.isDefined(refresh_promise)) {
                $timeout.cancel(refresh_promise);
                refresh_promise = undefined;
            }
        };
    }]);
