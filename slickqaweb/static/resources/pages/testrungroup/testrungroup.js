/**
 * User: Jason Corbett
 * Date: 1/15/14
 * Time: 2:39 PM
 */
"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/testrungroup/:id', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewTestrunGroupCtrl'
            })
            .when('/testrungroups/latest', {
                templateUrl: 'static/resources/pages/testrungroup/latest-testrungroups.html',
                controller: 'LatestTestrunGroupsCtrl'
            })
            .when('/testrungroups/latest/:name', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'FindLatestTestrunGroupCtrl'
            })
            .when('/testrungroup/:id/edit', {
                templateUrl: 'static/resources/pages/testrungroup/edit-testrungroup.html',
                controller: 'EditTestrunGroupCtrl'
            });
        nav.addLink('Reports', 'Testrun Groups', 'testrungroups/latest');
    }])
    .controller('ViewTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
        $scope.editbutton = {
            href: "testrungroup/" + $routeParams['id'] + "/edit",
            name: "Add or Remove Testruns"
        };

        $scope.parallelSummaryData = new google.visualization.DataTable();
        $scope.parallelSummaryData.addColumn('string', 'Status');
        $scope.parallelSummaryData.addColumn('number', 'Results');

        $scope.parallelIndividualData = new google.visualization.DataTable();
        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

        $scope.serialData = new google.visualization.DataTable();
        $scope.serialData.addColumn('string', 'Testrun Name');

        $scope.getTestrunGroupData = function() {

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
                        color: '#ffffff'
                    },
                    slantedText: true
                },
                colors: []
            };

            $scope.serialChartOptions = {
                chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
                backgroundColor: "none",
                legend: {
                    textStyle: {
                        color: "#ffffff"
                    }
                },
                colors: []
            };

            rest.one('testrungroups', $routeParams.id).get().then(function (testrungroup) {
                $scope.testrungroup = testrungroup;
                nav.setTitle(testrungroup.name);

                if (testrungroup.grouptype == "PARALLEL") {

                    $scope.parallelSummaryData = new google.visualization.DataTable();
                    $scope.parallelSummaryData.addColumn('string', 'Status');
                    $scope.parallelSummaryData.addColumn('number', 'Results');

                    $scope.parallelIndividualData = new google.visualization.DataTable();
                    $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        $scope.parallelSummaryData.addRow([replaceOnStatus(status, " "), testrungroup.groupSummary.resultsByStatus[status]]);
                        var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                        $scope.summaryChartOptions.colors.push(color);
                        $scope.individualChartOptions.colors.push(color);

                        $scope.parallelIndividualData.addColumn('number', replaceOnStatus(status, " "))
                    });

                    _.each(testrungroup.testruns, function (testrun) {
                        var row = [testrun.project.name + " - " + testrun.name];
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status]);
                        });
                        $scope.parallelIndividualData.addRow(row);
                    });
                } else {
                    $scope.serialData = new google.visualization.DataTable();
                    $scope.serialData.addColumn('date', 'Recorded');
                    _.sortBy($scope.testruns, function (testrun) {
                        return testrun.dateCreated;
                    });
                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                        $scope.serialChartOptions.colors.push(color);
                        $scope.serialData.addColumn('number', replaceOnStatus(status, " "))
                    });
                    _.each(testrungroup.testruns, function (testrun) {
                        var row = [new Date(testrun.dateCreated)];
                        _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                            row.push(testrun.summary.resultsByStatus[status]);
                        });
                        $scope.serialData.addRow(row);
                    });
                }
                if (testrungroup.state !== "FINISHED") {
                    $scope.refreshPromise = $timeout($scope.getTestrunGroupData, 3000);
                }
            });
        };

        $scope.getTestrunGroupData();
    }])
    .controller('LatestTestrunGroupsCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testrungroups = [];
        $scope.groupList = {};

        $scope.newtr = {
            name: '',
            grouptype: 'PARALLEL'
        };
        $scope.grouptypes = ['PARALLEL', 'SERIAL'];

        $scope.getTestrunGroups = function() {
            rest.all('testrungroups').getList({orderby: "-created",limit: 200}).then(function(testrungroups) {
                $scope.testrungroups = testrungroups;
            });
        };
        $scope.getTestrunGroups();

        $scope.addTestrunGroup = function() {
            if ($scope.newtr.name != '') {
                rest.all('testrungroups').post($scope.newtr).then(function() {
                    $scope.newtr.name = '';
                    $scope.newTestrungroup.$setPristine();
                    $scope.getTestrunGroups();
                });
            }
        };

        $scope.deleteTestrunGroup = function(trgroup) {
            trgroup.remove().then(function() {
                $scope.getTestrunGroups();
            });
        };
    }])
    .controller('EditTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$cookies', function($scope, rest, nav, $routeParams, $cookies) {
        $scope.testrungroup = {};
        $scope.testrungroupTestrunList = {};
        $scope.availableTestrunList = {};

        $scope.project = null;
        $scope.release = null;
        $scope.testplan = null;

        $scope.projects = [];
        $scope.releases = [];
        $scope.testplans = [];
        $scope.testruns = [];

        rest.one('testrungroups', $routeParams.id).get().then(function(testrungroup) {
            $scope.testrungroup = testrungroup;
            nav.setTitle('Edit: ' + testrungroup.name);
        });

        rest.all('projects').getList().then(function(projects) {
            $scope.projects = _.sortBy(projects, "lastUpdated");
            $scope.projects.reverse();
            if ($cookies.get('slick-last-project-used')) {
                $scope.project = _.find(projects, function(project) {
                    return $cookies.get('slick-last-project-used') === project.name;
                });
            }
        });

        $scope.$watch('project', function() {
            if ($scope.project) {
                $scope.releases = $scope.project.releases;
                $scope.release = null;
                rest.all('testplans').getList({q: "eq(project.id,\"" + $scope.project.id + "\")"}).then(function(testplans) {
                    $scope.testplan = null;
                    $scope.testplans = testplans;
                });
                $scope.updateTestrunList();
            }
        });

        $scope.$watch('release', function() {
            $scope.updateTestrunList();
        });
        $scope.$watch('testplan', function() {
            $scope.updateTestrunList();
        });

        $scope.updateTestrunList = function() {
            var filter = { 'limit': 500, 'orderby': '-dateCreated' };
            if ($scope.project) {
                filter['project.id'] = $scope.project.id;
            }
            if ($scope.release) {
                filter['release.releaseId'] = $scope.release.id;
            }
            if ($scope.testplan) {
                filter['testplanId'] = $scope.testplan.id;
            }
            rest.all('testruns').getList(filter).then(function(testruns) {
                $scope.testruns = testruns;
            });
        };

        $scope.addTestrunToGroup = function(testrun) {
            rest.one('testrungroups', $scope.testrungroup.id).one('addtestrun', testrun.id).post().then(function(testrungroup) {
                $scope.testrungroup = testrungroup;
            });
        };

        $scope.removeTestrunFromGroup = function(testrun) {
            rest.one('testrungroups', $scope.testrungroup.id).one('removetestrun', testrun.id).remove().then(function(testrungroup) {
                $scope.testrungroup = testrungroup;
            });
        };

    }])
    .controller('FindLatestTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testrungroup = {};
        $scope.testrunList = {};

        $scope.parallelSummaryData = new google.visualization.DataTable();
        $scope.parallelSummaryData.addColumn('string', 'Status');
        $scope.parallelSummaryData.addColumn('number', 'Results');

        $scope.parallelIndividualData = new google.visualization.DataTable();
        $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

        $scope.serialData = new google.visualization.DataTable();
        $scope.serialData.addColumn('string', 'Testrun Name');

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
                    color: '#ffffff'
                },
                slantedText: true
            },
            colors: []
        };

        $scope.serialChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "none",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };

        rest.all('testrungroups').getList({q: "contains(name,\"" + $routeParams.name + "\")", orderby: "-created", limit: 1}).then(function(testrungroups) {
            $scope.testrungroup = testrungroups[0];
            var testrungroup = $scope.testrungroup;
            nav.setTitle(testrungroup.name);

            if(testrungroup.grouptype == "PARALLEL") {

                $scope.parallelSummaryData = new google.visualization.DataTable();
                $scope.parallelSummaryData.addColumn('string', 'Status');
                $scope.parallelSummaryData.addColumn('number', 'Results');

                $scope.parallelIndividualData = new google.visualization.DataTable();
                $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


                _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                    $scope.parallelSummaryData.addRow([replaceOnStatus(status, " "), testrungroup.groupSummary.resultsByStatus[status]]);
                    var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                    $scope.summaryChartOptions.colors.push(color);
                    $scope.individualChartOptions.colors.push(color);

                    $scope.parallelIndividualData.addColumn('number', replaceOnStatus(status, " "))
                });

                _.each(testrungroup.testruns, function(testrun) {
                    var row = [testrun.project.name + " - " + testrun.name];
                    _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                        row.push(testrun.summary.resultsByStatus[status]);
                    });
                    $scope.parallelIndividualData.addRow(row);
                });
            } else {
                $scope.serialData = new google.visualization.DataTable();
                $scope.serialData.addColumn('date', 'Recorded');
                _.sortBy($scope.testruns, function(testrun) {
                    return testrun.dateCreated;
                });
                _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                    var color = getStyle(replaceOnStatus(status, "") + "-element", "color");
                    $scope.serialChartOptions.colors.push(color);
                    $scope.serialData.addColumn('number', replaceOnStatus(status, " "))
                });
                _.each(testrungroup.testruns, function(testrun) {
                    var row = [new Date(testrun.dateCreated)];
                    _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                        row.push(testrun.summary.resultsByStatus[status]);
                    });
                    $scope.serialData.addRow(row);
                });
            }

        });

    }]);

