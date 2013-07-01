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

        $scope.addProject = function() {
            nav.addLink('Projects', 'Foo Project', 'projects/foo')
        }
        $scope.toggleShow = function(group) {
            if(group.show) {
                group.show = false;
            } else {
                group.show = true;
            }
        }
    }]);
