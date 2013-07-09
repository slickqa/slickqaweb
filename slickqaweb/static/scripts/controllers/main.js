'use strict';

angular.module('slickPrototypeApp')
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'static/views/main.html',
        controller: 'MainCtrl'
      });
  }])
  .controller('MainCtrl', ['$scope', function ($scope) {
  }]);
