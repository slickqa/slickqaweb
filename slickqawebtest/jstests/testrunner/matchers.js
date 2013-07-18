/**
 * User: jcorbett
 * Date: 7/18/13
 * Time: 12:41 PM
 */

"use strict";

beforeEach(function() {
    this.addMatchers({
        has: function(expected, name) {
            var actual = this.actual;
            if(name === undefined) {
                name = "" + actual;
            }

            var notText = this.isNot ? " not" : "";

            this.message = function () {
                return "Expected " + name + notText + " to have key " + expected;
            };

            return _.has(actual, expected);
        }
    });
});
