'use strict';

angular.module('slickServicesModule', ['ngResource']);

angular.module('slickPrototypeApp', ['slickServicesModule'])
  .config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode(true);
  }]);
