/**
 * User: jcorbett
 * Date: 6/26/13
 * Time: 9:15 AM
 */
"use strict";


angular.module('slickApp')
    .controller('ParentCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        $scope.nav = nav;
    }]);
