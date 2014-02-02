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
            });
        nav.addLink('Reports', 'Latest Testrun Groups', 'testrungroups/latest');
    }])
    .controller('ViewTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
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

        $scope.serialChartOptions = {
            chartArea: {left: '5%', top: '5%', width: '85%', height: '80%'},
            backgroundColor: "#000000",
            legend: {
                textStyle: {
                    color: "#ffffff"
                }
            },
            colors: []
        };

        rest.one('testrungroups', $routeParams.id).get().then(function(testrungroup) {
            $scope.testrungroup = testrungroup;
            nav.setTitle(testrungroup.name);

            if(testrungroup.grouptype == "PARALLEL") {

                $scope.parallelSummaryData = new google.visualization.DataTable();
                $scope.parallelSummaryData.addColumn('string', 'Status');
                $scope.parallelSummaryData.addColumn('number', 'Results');

                $scope.parallelIndividualData = new google.visualization.DataTable();
                $scope.parallelIndividualData.addColumn('string', 'Testrun Name');


                _.each(testrungroup.groupSummary.statusListOrdered, function(status) {
                    $scope.parallelSummaryData.addRow([status.replace("_", " "), testrungroup.groupSummary.resultsByStatus[status]]);
                    var color = getStyle(status.replace("_", "") + "-element", "color");
                    $scope.summaryChartOptions.colors.push(color);
                    $scope.individualChartOptions.colors.push(color);

                    $scope.parallelIndividualData.addColumn('number', status.replace("_", " "))
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
                    var color = getStyle(status.replace("_", "") + "-element", "color");
                    $scope.serialChartOptions.colors.push(color);
                    $scope.serialData.addColumn('number', status.replace("_", " "))
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
    }])
    .controller('LatestTestrunGroupsCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.testrungroups = [];
        $scope.groupList = {};

        rest.all('testrungroups').getList({orderby: "-created",limit: 200}).then(function(testrungroups) {
            $scope.testrungroups = testrungroups;
        });
    }]);
