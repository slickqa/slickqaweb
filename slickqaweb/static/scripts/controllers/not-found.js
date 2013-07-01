'use strict';
/**
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:06 PM
 */

angular.module('slickPrototypeApp')
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.otherwise({
            templateUrl: 'views/not-found.html',
            controller: 'NotFoundCtrl'
        });
    }])
    .controller('NotFoundCtrl', ['$scope', function ($scope) {
        // nothing to do right now
    }]);
