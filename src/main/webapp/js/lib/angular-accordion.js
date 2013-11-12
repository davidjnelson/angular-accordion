angular.module('angular-accordion', [])
    .directive('angularAccordion', function() {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            template: '<div ng-transclude class="angular-accordion-container"></div>',
            controller: ['$scope', function($scope) {
                var panes = [];

                this.expandPane = function(paneToExpand) {
                    angular.forEach(panes, function(iteratedPane) {
                        if(paneToExpand !== iteratedPane) {
                            iteratedPane.expanded = false;
                        }
                    });
                };

                this.addPane = function(pane) {
                    panes.push(pane);
                };
            }],
            scope: {}
        };
    })
    .directive('pane', function() {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            template: '<div ng-transclude class="angular-accordion-pane"></div>'
        };
    })
    .directive('paneHeader', ['$window', 'Debounce', function($window, Debounce) {
        return {
            restrict: 'EA',
            require: '^angularAccordion',
            transclude: true,
            replace: true,
            link: function(scope, iElement, iAttrs, controller) {
                scope.expanded = false;
                scope.passOnExpand = iAttrs.passOnExpand;
                scope.disabled = iAttrs.disabled;
                controller.addPane(scope);

                // TODO: figure out how to trigger this without interpolation in the template
                iAttrs.$observe('disabled', function(value) {
                    // attributes always get passed as strings
                    if(value === 'true') {
                        scope.disabled = true;
                    } else {
                        scope.disabled = false;
                    }
                });

                var computed = function(rawDomElement, property) {
                    var computedValueAsString = $window.getComputedStyle(rawDomElement).getPropertyValue(property).replace('px', '');
                    return parseFloat(computedValueAsString);
                };

                var computeExpandedPaneHeight = function() {
                    var parentContainer = iElement.parent().parent()[0];
                    var header = iElement[0];
                    var paneWrapper = iElement.parent()[0];
                    var contentPane = iElement.next()[0];
                    var headerCount = iElement.parent().parent().children().length;

                    var containerHeight = computed(parentContainer, 'height');
                    var headersHeight = ((computed(header, 'height') + computed(header, 'padding-top') + computed(header, 'padding-bottom') +
                        computed(header, 'margin-top') + computed(header, 'margin-bottom') + computed(header, 'border-top') + computed(header, 'border-bottom') +
                        computed(paneWrapper, 'padding-top') + computed(paneWrapper, 'padding-bottom') + computed(paneWrapper, 'margin-top') +
                        computed(paneWrapper, 'margin-bottom') + computed(paneWrapper, 'border-top') + computed(paneWrapper, 'border-bottom')) * headerCount) +
                        (computed(contentPane, 'padding-top') + computed(contentPane, 'padding-bottom') + computed(contentPane, 'margin-top') +
                            computed(contentPane, 'margin-bottom') + computed(contentPane, 'border-top') + computed(contentPane, 'border-bottom'));

                    return containerHeight - headersHeight;
                }

                scope.toggle = function() {
                    if(!scope.disabled) {
                        scope.expanded = !scope.expanded;

                        if(scope.expanded) {
                            iElement.next().css('height', computeExpandedPaneHeight() + 'px');
                            scope.$emit('angular-accordion-expand', scope.passOnExpand);
                        }

                        controller.expandPane(scope);
                    }
                };

                angular.element($window).bind('resize', Debounce.debounce(function() {
                    // must apply since the browser resize event is not seen by the digest process
                    scope.$apply(function() {
                        iElement.next().css('height', computeExpandedPaneHeight() + 'px');
                    });
                }, 50));

                scope.$on('expand', function(event, eventArguments) {
                    if(eventArguments === scope.passOnExpand) {
                        // only toggle if we are loading a deeplinked route
                        if(!scope.expanded) {
                            scope.toggle();
                        }
                    }
                });
            },
            template: '<div ng-transclude class="angular-accordion-header" ng-click="toggle()" ' +
                'ng-class="{ angularaccordionheaderselected: expanded, angulardisabledpane: disabled }"></div>'
        };
    }])
    .directive('paneContent', function() {
        return {
            restrict: 'EA',
            require: '^paneHeader',
            transclude: true,
            replace: true,
            template: '<div ng-transclude class="angular-accordion-pane-content" ng-show="expanded"></div>'
        };
    })
    .service('Debounce', function() {
        var self = this;

        // debounce() method is slightly modified version of:
        // Underscore.js 1.4.4
        // http://underscorejs.org
        // (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
        // Underscore may be freely distributed under the MIT license.
        self.debounce = function(func, wait, immediate) {
            var timeout,
                result;

            return function() {
                var context = this,
                    args = arguments,
                    callNow = immediate && !timeout;

                var later = function() {
                    timeout = null;

                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };

                clearTimeout(timeout);
                timeout = setTimeout(later, wait);

                if (callNow) {
                    result = func.apply(context, args);
                }

                return result;
            };
        };

        return self;
    });