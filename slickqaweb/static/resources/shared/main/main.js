'use strict';

angular.module('slickApp')
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'static/resources/shared/main/main.html',
        controller: 'MainCtrl'
      });
  }])
  .controller('MainCtrl', ['$scope', 'Restangular', function ($scope, rest) {
        $scope.testrunTableOne = {};
        $scope.testrunTableTwo = {};

        $scope.testrunListOne = [];
        $scope.testrunListTwo = [];

        rest.all('testruns').getList({orderby: '-dateCreated', limit: 10}).then(function(testruns) {
            $scope.testrunListOne = testruns.splice(0, 5);
            $scope.testrunListTwo = testruns;
            window.testruns = testruns;
        });
        window.scope = $scope;
  }]);
