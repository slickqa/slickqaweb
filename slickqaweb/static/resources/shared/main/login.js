/**
 * User: jcorbett
 * Date: 7/31/13
 * Time: 2:06 PM
 */


angular.module('slickLoginApp')
    .controller('loginCtrl', ['$scope', function ($scope) {
        $scope.postForm = function($event) {
            //TODO: Figure out a better way to do this
            $event.target.parentElement.submit()
        }
    }]);
