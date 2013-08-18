'use strict';
/**
 * Header Controller
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:00 PM
 */

angular.module('slickApp')
    .controller('HeaderCtrl', ['$scope', 'NavigationService', 'UserService', '$http', function ($scope, nav, user, $http) {
        $scope.title = 'Slick';

        $scope.showLogin = false;

        user.refresh();
        $scope.user = user.currentUser;

        $scope.getAccountName = function() {
            if ($scope.user.short_name) {
                return $scope.user.short_name;
            }
            if ($scope.user.full_name) {
                return $scope.user.full_name;
            }
            return $scope.user.email;
        };

        $scope.logout = function($event) {
            $event.preventDefault();
            $http({method: 'GET', url: 'logout'}).success(function() {
                user.refresh();
            })
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

