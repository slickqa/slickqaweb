'use strict';
/**
 * Header Controller
 * User: jcorbett
 * Date: 5/28/13
 * Time: 11:00 PM
 */

angular.module('slickApp')
    .controller('HeaderCtrl', ['$scope', 'NavigationService', 'User', 'Restangular', '$http', function ($scope, nav, user, rest, $http) {
        $scope.title = 'Slick';

        function getCurrentUser() {
            rest.one('users', 'current').get().then(function(user) {
                $scope.user = user;
            }, function() {
                $scope.user = {};
            });
        }

        $scope.showLogin = false;

        $scope.user = {};
        getCurrentUser();

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
                getCurrentUser();
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

