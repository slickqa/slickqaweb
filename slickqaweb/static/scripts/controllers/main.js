'use strict';

angular.module('slickApp')
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      });
  }])
  .controller('MainCtrl', ['$scope', function ($scope) {
  }]);
