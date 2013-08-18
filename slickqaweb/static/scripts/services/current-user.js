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
                var emptyUser = function() {
                    _.each(userservice.currentUser, function(value, key) {
                        delete userservice.currentUser[key];
                    });
                };
                rest.one('users', 'current').get().then(function(user) {
                    emptyUser();
                    _.each(user, function(value, key) {
                        userservice.currentUser[key] = value;
                    });
                }, function() {
                    emptyUser();
                });
            },
            refresh: function() {
                userservice.getCurrentUser();
            }
        };
        return userservice;
    }]);
