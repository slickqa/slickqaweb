'use strict';

angular.module('slickApp', ['ngResource', 'ngCookies', 'restangular'])
  .config(['$locationProvider', 'RestangularProvider', function ($locationProvider, RestangularProvider) {
    $locationProvider.html5Mode(true);
    RestangularProvider.setBaseUrl("api/");
  }]);

angular.module('slickLoginApp', []);
