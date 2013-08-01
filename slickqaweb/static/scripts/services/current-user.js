/**
 * User: jcorbett
 * Date: 7/31/13
 * Time: 3:03 PM
 */

"use strict";

angular.module('slickApp')
    .factory('User', [ '$resource', function($resource) {
        return $resource('api/users/:email', {}, {'getCurrentUser': {'method': 'GET', 'params': {'email': 'current'}}});
    }]);
