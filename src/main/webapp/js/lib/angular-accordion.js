angular.module('angular-accordion', [])
    .factory('AngularAccordionMessageBus', function() {
        // create a constructor function that the parent directive can instantiate in its controller
        var AngularAccordionMessageBus = function() {
            var self = this;

            self.accordionPaneScopes = [];
            self.lastExpandedScopeId = 0;

            var heightPaddingBorderMarginZeroed = {
                'padding-top': '0px',
                'padding-bottom': '0px',
                'border-top': '0px',
                'border-bottom': '0px',
                'margin-top': '0px',
                'margin-bottom': '0px',
                'height': '0px'
            };

            // debounce() method is slightly modified version of:
            // Underscore.js 1.4.4
            // http://underscorejs.org
            // (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
            // Underscore may be freely distributed under the MIT license.
            var debounce = function(func, wait, immediate) {
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

            var animatedCollapse = function(paneContentJquery, scope) {
                scope.isActive = false;

                paneContentJquery.animate(heightPaddingBorderMarginZeroed, 100);

                if(typeof(window[scope.$parent.collapsedEventHandlerName]) !== 'undefined') {
                    window[scope.$parent.collapsedEventHandlerName]();
                }
            };

            var nonAnimatedExpand = function(paneContentJqLite, scope) {
                var paneHeight = scope.calculatePaneContentHeight(false);
                paneContentJqLite.css('height', paneHeight);
            };

            var nonAnimatedCollapse = function(paneContentJqLite) {
                paneContentJqLite.css(heightPaddingBorderMarginZeroed);
            };

            // the reason for passing both the jquery and jqlite objects is to show where to cut when removing the
            // jquery dependency
            var animatedExpand = function(paneContentJquery, paneContentJqLite, scope) {
                self.lastExpandedScopeId = scope.$id;

                var paneHeight = scope.calculatePaneContentHeight(false);

                paneContentJqLite.removeAttr('style');
                paneContentJqLite.css('height', '0px');

                paneContentJquery.animate({ height: paneHeight }, 100);
            };

            self.collapseExpand = function(animate) {
                angular.forEach(self.accordionPaneScopes, function(iteratedScope, index) {
                    // TODO: remove the dependency here on jquery for non IE9< by getting the new angular css3 based animation working,
                    // while still allowing IE9< to animate if jquery is present
                    var paneContentJquery = iteratedScope.getPaneContentJquery();

                    var paneContentJqLite = iteratedScope.getPaneContentJqLite();
                    var expanding = iteratedScope.isActive;
                    var collapsing = !iteratedScope.isActive;

                    if(collapsing && animate) {
                        animatedCollapse(paneContentJquery, iteratedScope);
                    } else if(collapsing && !animate) {
                        nonAnimatedCollapse(paneContentJqLite);
                    } else if(expanding && animate) {
                        animatedExpand(paneContentJquery, paneContentJqLite, iteratedScope);
                    } else if(expanding && !animate) {
                        nonAnimatedExpand(paneContentJqLite, iteratedScope);
                    }
                });
            };

            self.restoreActiveScope = function(isResize) {
                self.collapseExpand(false);
            };

            window.onresize = debounce(function() {
                self.restoreActiveScope(true);
            }, 50);
        };

        return AngularAccordionMessageBus;
    })
    .directive('angularAccordion', ['AngularAccordionMessageBus', '$timeout', function(AngularAccordionMessageBus, $timeout) {
        return {
            restrict: 'EA',
            template: '<div data-ng-transclude></div>',
            replace: true,
            transclude: true,
            controller: ['$scope', function($scope) {
                $scope.AngularAccordionMessageBus = new AngularAccordionMessageBus();
            }],
            link: function(scope, element, attributes, controller) {
                scope.collapsedEventHandlerName = attributes.onCollapsed;

                // we know how many children (accordion panes) there are by poking the pre-rendered dom.  for this accordion,
                // dynamically adding panes is not one of its goals.  as such, we can simply find out if all the child
                // directives loaded by checking the count every millisecond (it's ready on the first check).
                var childCount = element.children().length;

                $timeout(function() {
                    if(scope.AngularAccordionMessageBus.accordionPaneScopes.length === childCount) {
                        scope.AngularAccordionMessageBus.accordionPaneDomNodeCount = childCount;
                        scope.AngularAccordionMessageBus.restoreActiveScope(false);
                    }
                }, 1);
            }
        };
    }])
    .directive('angularAccordionPane', function() {
        return {
            restrict: 'EA',
            template:
                '<div class="angular-accordion-container">' +
                    '<div class="angular-accordion-header" data-ng-click="childExpandCollapse(true)" data-ng-class="{ angularaccordionheaderselected: isActive }">' +
                    '{{ title }}</div>' +
                    '<div class="angular-accordion-pane" data-ng-transclude></div>' +
                    '</div>',
            replace: true,
            transclude: true,
            controller: ['$scope', function($scope) {
                $scope.isActive = false;
                // TODO: why is this not available in the prototype chain directly, and why do we have to go up two scopes to read it?
                $scope.AngularAccordionMessageBus = $scope.$parent.$parent.AngularAccordionMessageBus;

                // don't add duplicate entries in the list when the route changes.
                // instead, delete the old entries and update them with the new ones
                if($scope.AngularAccordionMessageBus.accordionPaneDomNodeCount === $scope.AngularAccordionMessageBus.accordionPaneScopes.length) {
                    $scope.AngularAccordionMessageBus.accordionPaneScopes = [];
                }

                $scope.AngularAccordionMessageBus.accordionPaneScopes.push($scope);
            }],
            link: function(scope, element, attributes, controller) {
                scope.previousStyles = {};

                var setIsActiveFromTemplateInMessageBusListOfScopes = function() {
                    if(attributes.isActive === 'true') {
                        scope.isActive = true;

                        angular.forEach(scope.AngularAccordionMessageBus.accordionPaneScopes, function(iteratedScope, index) {
                            // update this scope in the messagebus list of scopes so we have it for expanding panes from the template
                            if(iteratedScope.$id == scope.$id) {
                                scope.AngularAccordionMessageBus.accordionPaneScopes[index].isActive = true;
                                return;
                            }
                        });
                    }
                }

                var convertCssNumberToJavascriptNumber = function(cssNumber) {
                    if(typeof(cssNumber) === 'undefined' || cssNumber === '') {
                        return 0;
                    }

                    return parseInt(cssNumber.split(' ')[0].replace('px', ''));
                };

                var getComputedStyleAsNumber = function(element, style) {
                    // TODO: remove the jquery dependency here by extracting the jquery or similar getComputedStyle implementation that works in IE9<
                    var computedStyle = $(element).css(style);
                    return convertCssNumberToJavascriptNumber(computedStyle);
                };

                var getElementPaddingMarginAndBorderHeight = function(element) {
                    var paddingTop = getComputedStyleAsNumber(element, 'padding-top');
                    var paddingBottom = getComputedStyleAsNumber(element, 'padding-bottom');
                    var marginTop = getComputedStyleAsNumber(element, 'margin-top');
                    var marginBottom = getComputedStyleAsNumber(element, 'margin-bottom');
                    // firefox requires borderTopWidth and borderBottomWidth instead of the shorthand
                    var borderTop = getComputedStyleAsNumber(element, 'borderTopWidth');
                    var borderBottom = getComputedStyleAsNumber(element, 'borderBottomWidth');

                    return paddingTop + paddingBottom + marginTop + marginBottom + borderTop + borderBottom;
                };

                var getElementOuterHeight = function(element) {
                    var height = getComputedStyleAsNumber(element, 'height');
                    var elementPaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(element);

                    return height + elementPaddingMarginAndBorderHeight;
                };

                scope.getPaneContentJqLite = function() {
                    var paneContentJqLite = angular.element(element.children()[1]);

                    return paneContentJqLite;
                };

                scope.getPaneContentJquery = function() {
                    var paneContentJquery = $(element.children()[1]);

                    return paneContentJquery;
                };

                scope.calculatePaneContentHeight = function(isResize) {
                    var paneContainerElement = element[0];
                    var paneTitleElement = element.children()[0];
                    var paneContentElement = element.children()[1];

                    var containerHeight = document.getElementById('angular-accordion-container').offsetHeight;
                    var panesCount = scope.AngularAccordionMessageBus.accordionPaneScopes.length;
                    var paneContainerPaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(paneContainerElement);
                    var paneTitleOuterHeight = getElementOuterHeight(paneTitleElement);
                    var paneContentPaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(paneContentElement);

                    // to account for margin collapsing, we use this algorithm:
                    var panesCountMinusOneTimesPaneContainerPaddingMarginAndWidthDividedByTwo = ((panesCount - 1) * paneContainerPaddingMarginAndBorderHeight) / 2;
                    var paneTitleOuterHeightTimesPaneCount = paneTitleOuterHeight * panesCount;
                    // paneContainerPaddingMarginAndBorderHeight accounts for the margin on the top of the first accordion and the bottom of the last one
                    var paneHeight = (containerHeight - (paneContainerPaddingMarginAndBorderHeight + panesCountMinusOneTimesPaneContainerPaddingMarginAndWidthDividedByTwo +
                        paneTitleOuterHeightTimesPaneCount + paneContentPaddingMarginAndBorderHeight)) - scope.previousContentPanePaddingMarginAndBorderHeight;

                    if(isResize) {
                        paneHeight += scope.previousContentPanePaddingMarginAndBorderHeight;
                    }

                    return paneHeight + 'px';
                };

                scope.childExpandCollapse = function(animate) {
                    angular.forEach(scope.AngularAccordionMessageBus.accordionPaneScopes, function(accordionPaneScope, index) {
                        if(scope.$id === accordionPaneScope.$id) {
                            scope.AngularAccordionMessageBus.accordionPaneScopes[index].isActive = !scope.AngularAccordionMessageBus.accordionPaneScopes[index].isActive;
                        } else {
                            scope.AngularAccordionMessageBus.accordionPaneScopes[index].isActive = false;
                        }
                    });

                    scope.AngularAccordionMessageBus.collapseExpand(animate);
                };

                scope.previousContentPanePaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(angular.element(element.children()[1]));

                setIsActiveFromTemplateInMessageBusListOfScopes();
            },
            scope: {
                title: '@'
            }
        };
    });