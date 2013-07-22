'use strict';
/**
 * User: jcorbett
 * Date: 5/31/13
 * Time: 2:00 PM
 */

angular.module('slickPrototypeApp')
    .controller('NavCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        $scope.nav = nav;
        $scope.slickHomeUrl = document.baseURI;

        $scope.toggleShow = function(group, $event) {
            if(group.show) {
                group.show = false;
            } else {
                group.show = true;
            }
            $event.preventDefault();
        };

        $scope.toggleMode = function($event) {
            nav.toggleMode();
            $event.preventDefault();
        };

    }]);
