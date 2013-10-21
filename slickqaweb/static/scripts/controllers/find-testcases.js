/**
 * User: jcorbett
 * Date: 9/27/13
 * Time: 2:05 PM
 */

"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/find-testcases', {
                templateUrl: 'static/views/find-testcases.html',
                controller: 'FindTestcasesCtrl'
            })
        nav.addLink('Test Management', 'Find Testcases', 'find-testcases');
    }])
    .controller('FindTestcasesCtrl', ['$scope', 'NameBasedRestangular', 'Restangular', 'NavigationService', '$routeParams', function ($scope, projrest, rest, nav, $routeParams) {
        $scope.model = {};
        $scope.model.tags = ["foo", "bar", "hello", "world", "Lee", "Sucks"];

        $scope.$watch('model.tags', function() {
            console.log($scope.model.tags);
        });
    }]);

