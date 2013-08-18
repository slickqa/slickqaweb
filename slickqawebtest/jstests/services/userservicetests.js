/**
 * User: jcorbett
 * Date: 8/18/13
 * Time: 11:40 AM
 */


'use strict';

describe('UserService (from current-user.js)', function() {
    var Restangular = {};
    var user = {};

    beforeEach(angular.mock.module('slickTestModule', function($provide) {
        $provide.value('Restangular', Restangular);
    }));

    beforeEach(angular.mock.inject(function(UserService) {
        user = UserService;
    }));

    it("Should provide an empty currentUser", function() {
        expect(user.currentUser).toBeDefined();
    })
});

