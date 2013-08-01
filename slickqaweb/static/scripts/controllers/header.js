'use strict';
/**
 * Header Controller
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:00 PM
 */

angular.module('slickApp')
    .controller('HeaderCtrl', ['$scope', 'NavigationService', 'User', function ($scope, nav, user) {
        $scope.title = 'Slick';

        $scope.showLogin = false;
        $scope.modalOpts = {
            backdropFade: true,
            dialogFade:true
        };

        $scope.user = user.getCurrentUser();
        $scope.getAccountName = function() {
            if ($scope.user.short_name) {
                return $scope.user.short_name;
            }
            if ($scope.user.full_name) {
                return $scope.user.full_name;
            }
            return $scope.user.email;
        };

        $scope.login = function($event) {
            $event.preventDefault();
            $scope.showLogin = true;
        };

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

