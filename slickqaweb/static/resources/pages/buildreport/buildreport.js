/**
 * Created by jcorbett on 2/2/14.
 */


angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/build-report/:project/:release/:build', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewBuildReportCtrl'
            });
    }])
    .controller('ViewBuildReportCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.testrungroup = {};
        $scope.testrunList = {};


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

        $scope.getBuildReportData = function() {
            rest.one('build-report', $routeParams.project).one($routeParams.release, $routeParams.build).get().then(function (buildreport) {
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
                $scope.testrungroup = buildreport;
                var testrungroup = buildreport;
                nav.setTitle(buildreport.name);

                $scope.parallelSummaryData = new google.visualization.DataTable();
                $scope.parallelSummaryData.addColumn('string', 'Status');
                $scope.parallelSummaryData.addColumn('number', 'Results');

                $scope.parallelIndividualData = new google.visualization.DataTable();
                $scope.parallelIndividualData.addColumn('string', 'Testrun Name');

                if (testrungroup.state !== "FINISHED") {
                    $scope.refresh_promise = $timeout($scope.getBuildReportData, 3000);
                }
                _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                    $scope.parallelSummaryData.addRow([status.replace("_", " "), testrungroup.groupSummary.resultsByStatus[status]]);
                    var color = getStyle(status.replace("_", "") + "-element", "color");
                    $scope.summaryChartOptions.colors.push(color);
                    $scope.individualChartOptions.colors.push(color);

                    $scope.parallelIndividualData.addColumn('number', status.replace("_", " "))
                });

                _.each(testrungroup.testruns, function (testrun) {
                    var row = [testrun.project.name + " - " + testrun.name];
                    _.each(testrungroup.groupSummary.statusListOrdered, function (status) {
                        row.push(testrun.summary.resultsByStatus[status]);
                    });
                    $scope.parallelIndividualData.addRow(row);
                });

            });
        };
        $scope.getBuildReportData();
    }]);
