/**
 * User: jcorbett
 * Date: 7/22/13
 * Time: 4:01 PM
 */

angular.module("slickApp")
    .filter('reverse', function() {
        return function(items) {
            if (!angular.isArray(items)) return false;
            return items.slice().reverse();
        }
    });


