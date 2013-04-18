//noinspection JSValidateTypes
angular.module('angular-accordion', [])
    .service('MessageBus', function() {
        var self = this;

        self.accordionPaneScopes = [];

        return self;
    })
    .directive('angularAccordion', function() {
        return {
            restrict: 'E',
            template: '<div ng-transclude></div>',
            replace: true,
            transclude: true
        };
    })
    .directive('angularAccordionPane', function() {
        return {
            restrict: 'E',
            template:
                '<div class="angular-accordion-container" ng-click="collapse()">' +
                    '<div class="angular-accordion-header"  ng-class="{ angularaccordionheaderselected: isActive }">' +
                        '{{ title }}</div>' +
                    '<div class="angular-accordion-pane" style="overflow: auto;" ng-transclude></div>' +
                '</div>',
            replace: true,
            transclude: true,
            controller: ['$scope', 'MessageBus', function($scope, MessageBus) {
                MessageBus.accordionPaneScopes.push($scope);
                $scope.MessageBus = MessageBus;
                $scope.isActive = false;
            }],
            link: function(scope, element, attributes, controller) {
                var getComputedStyleAsNumber = function(element, style) {
                    // TODO: extract the jquery getComputedStyle implementation to remove the jquery dependency
                    return parseInt($(element).css(style).replace('px', ''));

                    // TODO: remove jquery dependency here by using the following (working, tested) code non IE9< browsers
                    // return parseInt(window.getComputedStyle(element, null).getPropertyValue(style).replace('px', ''));
                };

                var getElementPaddingMarginAndBorderHeight = function(element) {
                    var paddingTop = getComputedStyleAsNumber(element, 'padding-top');
                    var paddingBottom = getComputedStyleAsNumber(element, 'padding-bottom');
                    var marginTop = getComputedStyleAsNumber(element, 'margin-top');
                    var marginBottom = getComputedStyleAsNumber(element, 'margin-bottom');
                    var borderTop = getComputedStyleAsNumber(element, 'border-top');
                    var borderBottom = getComputedStyleAsNumber(element, 'border-bottom');

                    return paddingTop + paddingBottom + marginTop + marginBottom + borderTop + borderBottom;
                };

                var getElementOuterHeight = function(element) {
                    var height = getComputedStyleAsNumber(element, 'height');
                    var elementPaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(element);

                    return height + elementPaddingMarginAndBorderHeight;
                };

                var collapseAll = function() {
                    angular.forEach(scope.MessageBus.accordionPaneScopes, function(iteratedScope, index) {
                        iteratedScope.isActive = false;
                    });
                };

                scope.calculatePaneContentHeight = function(paneContainerJqLite, paneTitleJqLite, paneContentJqLite) {
                    var paneContainerElement = paneContainerJqLite[0];
                    var paneTitleElement = paneTitleJqLite[0];
                    var paneContentElement = paneContentJqLite[0];

                    var containerHeight = document.getElementById('angular-accordion-container').offsetHeight;
                    var panesCount = scope.MessageBus.accordionPaneScopes.length;
                    var paneContainerPaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(paneContainerElement);
                    var paneTitleOuterHeight = getElementOuterHeight(paneTitleElement);
                    var paneContentPaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(paneContentElement);

                    // to account for margin collapsing, we use this algorithm:
                    var panesCountMinusOneTimesPaneContainerPaddingMarginAndWidthDividedByTwo = ((panesCount - 1) * paneContainerPaddingMarginAndBorderHeight) / 2;
                    var paneTitleOuterHeightTimesPaneCount = paneTitleOuterHeight * panesCount;
                    // paneContainerPaddingMarginAndBorderHeight accounts for the margin on the top of the first accordion and the bottom of the last one
                    var paneHeight = (containerHeight - (paneContainerPaddingMarginAndBorderHeight + panesCountMinusOneTimesPaneContainerPaddingMarginAndWidthDividedByTwo +
                        paneTitleOuterHeightTimesPaneCount + paneContentPaddingMarginAndBorderHeight)) - (scope.previousPaddingTop + scope.previousPaddingBottom);

                    return paneHeight + 'px';
                };

                scope.collapse = function(force) {
                    var paneContentJqLite = angular.element(element.children()[1]);

                    // TODO: remove the dependency here on jquery for non IE10< by getting the new angular css based animation working
                    // TODO: extract only the jquery animation code from jquery for animating in IE9<
                    var paneContentJquery = $(element.children()[1]);

                    if(!scope.isActive && !force) {
                        angular.forEach(scope.MessageBus.accordionPaneScopes, function(iteratedScope, index) {
                            iteratedScope.collapse(true);
                        });

                        scope.isActive = true;

                        var paneContainerJqLite = element;
                        var paneTitleJqLite = angular.element(element.children()[0]);

                        var paneHeight = scope.calculatePaneContentHeight(paneContainerJqLite, paneTitleJqLite, paneContentJqLite);
                        paneContentJquery.animate({
                            'height': paneHeight,
                            'padding-top': scope.previousPaddingTop,
                            'padding-bottom': scope.previousPaddingBottom
                        }, 100);
                    } else if(!force) {
                            scope.isActive = false;

                            paneContentJquery.animate({
                                'height': '0px',
                                'padding-top': '0px',
                                'padding-bottom': '0px'
                            }, 100);
                    } else {
                        if(typeof(scope.previousPaddingTop) === 'undefined') {
                            scope.previousPaddingTop = getComputedStyleAsNumber(paneContentJqLite[0], 'padding-top');
                        }

                        if(typeof(scope.previousPaddingBottom) === 'undefined') {
                            scope.previousPaddingBottom = getComputedStyleAsNumber(paneContentJqLite[0], 'padding-bottom');
                        }

                        scope.isActive = false;

                        paneContentJquery.css({
                            'height': '0px',
                            'padding-top': '0px',
                            'padding-bottom': '0px'
                        });
                    }
                };

                scope.collapse(true);
            },
            scope: {
                title: '@'
            }
        };
    });
