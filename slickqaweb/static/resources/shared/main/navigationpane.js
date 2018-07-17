'use strict';
/**
 * User: jcorbett
 * Date: 5/31/13
 * Time: 2:00 PM
 */

angular.module('slickApp')
    .controller('NavCtrl', ['$scope', 'NavigationService', function ($scope, nav) {
        $scope.nav = nav;
        $scope.slickHomeUrl = document.baseURI;

        $scope.toggleShow = function (group, $event) {
            group.show = !group.show;
            $event.preventDefault();
        };

        $scope.toggleMode = function ($event) {
            nav.toggleMode();
            $event.preventDefault();
        };

    }]);
