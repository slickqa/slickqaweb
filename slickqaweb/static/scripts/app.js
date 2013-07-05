'use strict';

angular.module('slickServicesModule', ['ngResource', 'ngCookies']);

angular.module('slickPrototypeApp', ['slickServicesModule'])
  .config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode(true);
  }]);
