/**
 * User: jcorbett
 * Date: 6/28/13
 * Time: 12:28 AM
 */
"use strict";

angular.module('slickApp')
    .factory('NameBasedRestangular', ['Restangular', function(Restangular) {
        return Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('api/');
            RestangularConfigurer.setRestangularFields({
                id: 'name'
            });
        });
    }]);

