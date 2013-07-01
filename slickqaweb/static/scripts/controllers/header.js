'use strict';
/**
 * Header Controller
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:00 PM
 */

angular.module('slickPrototypeApp')
    .controller('HeaderCtrl', ['$scope', 'NavigationService',function ($scope, nav) {
        $scope.title = 'Slick';

        $scope.showNav = function() {
            nav.toggleShow();
        }

        $scope.$on('$routeChangeSuccess', function() {
            if(nav.show()) {
                nav.toggleShow();
            }
        })

    }]);

