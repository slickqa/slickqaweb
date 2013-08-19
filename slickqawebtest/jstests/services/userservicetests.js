/**
 * User: jcorbett
 * Date: 8/18/13
 * Time: 11:40 AM
 */


'use strict';

describe('UserService (from current-user.js)', function() {
    var Restangular = {
        one: function(name0, name1) {
        }
    };
    var user = {};

    beforeEach(angular.mock.module('slickTestModule', function($provide) {
        $provide.value('Restangular', Restangular);
    }));

    beforeEach(angular.mock.inject(function(UserService) {
        user = UserService;
    }));

    it("Should provide an empty currentUser", function() {
        expect(user.currentUser).toBeDefined();
    });

    it("Should call getCurrentUser when refresh is called.", function() {
        spyOn(user, 'getCurrentUser');
        user.refresh();
        expect(user.getCurrentUser).toHaveBeenCalled();
    });

    it("Should make a rest call to api/users/current when getCurrentUser is called.", function() {

    });

});

