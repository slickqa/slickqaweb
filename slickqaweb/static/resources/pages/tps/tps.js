/**
 * Created by jcorbett on 2/13/14.
 */


angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/tps-report/:project/:release/:testplan*', {
                templateUrl: 'static/resources/pages/testrungroup/view-testrungroup.html',
                controller: 'ViewTPSReportCtrl'
            })
    }])
    .controller('ViewTPSReportCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', '$timeout', function ($scope, rest, nav, $routeParams, $timeout) {
        $scope.replaceOnStatus = replaceOnStatus;
        $scope.testrungroup = {};
        $scope.testrunList = {};
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
        $scope.serialData = new google.visualization.DataTable();
        $scope.serialData.addColumn('string', 'Testrun Name');
        var refresh_promise;

        $scope.getTPSReportData = function() {
            rest.one('tps', $routeParams.project).one($routeParams.release, $routeParams.testplan).get().then(function (tpsreport) {
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
                $scope.testrungroup = tpsreport;
                var testrungroup = tpsreport;
                if (tpsreport.hasOwnProperty('name')) {
                    nav.setTitle(tpsreport.name);
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
                } else {
                    refresh_promise = $timeout($scope.getTPSReportData, 500);
                }
            }, function errorCallback() {
                refresh_promise = $timeout($scope.getTPSReportData, 3000);
            });
        };

        $scope.stopRefresh = function() {
            if (angular.isDefined(refresh_promise)) {
                $timeout.cancel(refresh_promise);
                refresh_promise = undefined;
            }
        };
        $scope.getTPSReportData();



        $scope.$on('$destroy', function() {
            $scope.stopRefresh();
        });
    }]);
