/**
 * User: jcorbett
 * Date: 9/30/13
 * Time: 9:54 AM
 */


angular.module("slickApp")
    .directive("slickTagList", function() {
        return {
            restrict: 'E',
            require: ['^?form'],
            transclude: false,
            replace: true,
            templateUrl: "static/resources/shared/slit-tag-list/slick-tag-list.html",
            scope: {
                model: "="
            },

            link: function(scope, element, attrs, ctrls) {
                var i = 0;
                if(attrs.editable && (attrs.editable.toLowerCase() == "false" || attrs.editable.toLowerCase() == "no")) {
                    scope.editable = false;
                } else {
                    scope.editable = true;
                }
                var form = ctrls[0];

                scope.removeTag = function(tagName) {
                    var index = _.indexOf(scope.model, tagName);
                    if(index >= 0) {
                        scope.model.splice(index, 1);
                        if(form) {
                            form.$setDirty();
                        }
                    }
                };

                scope.addTag = function() {
                    if( ++i > 1) {
                        scope.model.unshift("new tag " + i);
                    } else {
                        scope.model.unshift("new tag");
                    }
                    if(form) {
                        form.$setDirty();
                    }
                };
            }

        };
    });
