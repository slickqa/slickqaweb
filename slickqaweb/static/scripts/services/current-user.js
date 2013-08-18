/**
 * User: jcorbett
 * Date: 7/31/13
 * Time: 3:03 PM
 */

"use strict";

angular.module('slickApp')
    .service('UserService', [ 'Restangular', function(rest) {
        var userservice = {
            currentUser: {},
            getCurrentUser: function() {
                rest.one('users', 'current').get().then(function(user) {
                    userservice.currentUser = user;
                }, function() {
                    userservice.currentUser = {};
                });
            },
            refresh: function() {
                userservice.getCurrentUser();
            }
        };
        return userservice;
    }]);
