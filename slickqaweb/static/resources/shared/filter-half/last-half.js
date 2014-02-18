/**
 * Created by jcorbett on 2/17/14.
 */


angular.module("slickApp")
    .filter('lastHalf', function() {
        return function(items) {
            if (!angular.isArray(items)) return false;
            return items.slice(Math.ceil(items.length / 2));
        }
    });

