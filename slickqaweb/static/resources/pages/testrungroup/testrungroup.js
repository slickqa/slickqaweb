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
            });
    }])
    .controller('ViewTestrunGroupCtrl', ['$scope', 'Restangular', 'NavigationService', '$routeParams', function ($scope, rest, nav, $routeParams) {
        $scope.trgroup = {};

        $scope.parallelData = new google.visualization.DataTable();
        $scope.parallelData.addColumn('string', 'Status');
        $scope.parallelData.addColumn('number', 'Results');

        $scope.options = {
            chartArea: {left: '5%', top: '5%', width: '90%', height: '90%'},
            backgroundColor: "#000000",
            pieSliceBorderColor: "#000000",
            legend: 'none',
            colors: []
        };

        rest.one('testrungroups', $routeParams.id).get().then(function(trgroup) {
            $scope.trgroup = trgroup;
            nav.setTitle(trgroup.name);

            $scope.parallelData = new google.visualization.DataTable();
            $scope.parallelData.addColumn('string', 'Status');
            $scope.parallelData.addColumn('number', 'Results');

            _.each(trgroup.groupSummary.statusListOrdered, function(status) {
                $scope.parallelData.addRow([status.replace("_", " "), trgroup.groupSummary.resultsByStatus[status]]);
                $scope.options.colors.push(getStyle(status.replace("_", "") + "-element", "color"));
            });

        });
    }]);
