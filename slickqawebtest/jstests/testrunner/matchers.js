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
        },

        toContainObjectWithProperty: function(propertyname, propertyvalue) {
            var actual = this.actual;
            var notText = this.isNot ? " not" : "";
            var valueText = "";
            if(propertyvalue !== undefined) {
                valueText = " and value " + propertyvalue;
            }

            this.message = function() {
                return "Expected " + actual + notText + " to have property with name " + propertyname + valueText + ".";
            };
            var found = false;
            _.each(actual, function(actualItem) {
                if(_.has(actualItem, propertyname)) {
                    if(propertyvalue !== undefined) {
                        if(actualItem[propertyname] == propertyvalue) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                }
            });
            return found;
        }

    });
});
