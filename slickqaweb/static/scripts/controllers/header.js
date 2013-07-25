'use strict';
/**
 * Header Controller
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:00 PM
 */

angular.module('slickApp')
    .controller('HeaderCtrl', ['$scope', 'NavigationService',function ($scope, nav) {
        $scope.title = 'Slick';

        $scope.getTitle = function() {
            return nav.getTitle();
        };

        $scope.showNav = function($event) {
            nav.toggleShow();
            if($event) {
                $event.preventDefault();
            }
        };

        $scope.$on('$routeChangeSuccess', function() {
            if(nav.show()) {
                nav.toggleShow();
            }
            nav.setTitle("Slick");
        });

    }]);

