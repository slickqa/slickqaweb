/**
 * Created by jason.corbett on 3/13/15.
 */


"use strict";

angular.module('slickApp')
    .config(['$routeProvider', 'NavigationServiceProvider', function ($routeProvider, nav) {
        $routeProvider
            .when('/settings/system-email', {
                templateUrl: 'static/resources/pages/email/system-email.html',
                controller: 'SystemEmailCtrl'
            });
        nav.addLink('Settings', 'System Email', 'settings/system-email');
    }])
    .controller('SystemEmailCtrl', ['$scope', 'Restangular', 'NavigationService', function ($scope, rest, nav) {
        nav.setTitle("System Email Settings");
        $scope.smtpsettings = {};

        $scope.getSettings = function() {
            rest.all("system-configuration").getList({"config-type": "email-system-configuration"})
                .then(function(smtpsettings) {
                    if(smtpsettings.length > 0) {
                        $scope.smtpsettings = smtpsettings[0];
                        $scope.smtpsettingsForm.$setPristine();
                    }
                });
        };

        $scope.getSettings();

        $scope.revert = function () {
            $scope.getSettings();
        };

        $scope.save = function() {
            $scope.smtpsettings.smtpPort = Number($scope.smtpsettings.smtpPort);
            $scope.smtpsettings.configurationType = "email-system-configuration";
            if($scope.smtpsettings.id) {
                $scope.smtpsettings.put().then(function(smtpsettings) {
                    $scope.smtpsettings = smtpsettings;
                    $scope.smtpsettingsForm.$setPristine();
                })
            } else {
                rest.all("system-configuration").post($scope.smtpsettings).then(function(smtpsettings) {
                    $scope.smtpsettings = smtpsettings;
                    $scope.smtpsettingsForm.$setPristine();
                });
            }
        };
    }]);
