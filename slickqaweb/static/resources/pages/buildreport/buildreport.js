/**
 * Created by jcorbett on 2/2/14.
 */


angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/build-report/:project/:release/:build*', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewBuildReportCtrl'
            });
    }])
    .controller('ViewBuildReportCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.replaceOnStatus = replaceOnStatus;
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

        var refresh_promise;

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

                refresh_promise = $timeout($scope.getBuildReportData, 3000);
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

            }, function errorCallback() {
                refresh_promise = $timeout($scope.getBuildReportData, 3000);
            });
        };

        $scope.stopRefresh = function() {
            if (angular.isDefined(refresh_promise)) {
                $timeout.cancel(refresh_promise);
                refresh_promise = undefined;
            }
        };
        $scope.getBuildReportData();



        $scope.$on('$destroy', function() {
            $scope.stopRefresh();
        });
    }]);
