/**
 * Created by jcorbett on 2/17/14.
 */


angular.module("slickApp")
    .filter('firstHalf', function() {
        return function(items) {
            if (!angular.isArray(items)) return false;
            return items.slice(0, Math.ceil(items.length / 2));
        }
    });

