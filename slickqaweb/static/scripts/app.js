'use strict';

angular.module('slickApp', ['ngResource', 'ngCookies'])
  .config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode(true);
  }]);
