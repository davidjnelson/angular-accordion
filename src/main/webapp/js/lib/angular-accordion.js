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
        var animateStringified = "{show: 'fade', hide: 'fade'}";
        return {
            restrict: 'E',
            template: '<div class="angular-accordion-container"><div class="angular-accordion-header" ng-click="collapse()" ng-class="{ angularaccordionheaderselected: isActive }">{{ title }}</div>' +
                '<div class="angular-accordion-pane" ng-show="isActive" style="overflow: auto;" ng-transclude ' + /*ng-animate="\'fade' + '\'*/ + '"></div></div>',
            replace: true,
            transclude: true,
            controller: ['$scope', 'MessageBus', function($scope, MessageBus) {
                MessageBus.accordionPaneScopes.push($scope);
                $scope.MessageBus = MessageBus;
            }],
            link: function(scope, element, attributes, controller) {
                var getComputedStyleAsNumber = function(element, style) {
                    return parseInt(window.getComputedStyle(element, null).getPropertyValue(style).replace('px', ''));
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
                    var paneHeight = containerHeight - (paneContainerPaddingMarginAndBorderHeight + panesCountMinusOneTimesPaneContainerPaddingMarginAndWidthDividedByTwo +
                        paneTitleOuterHeightTimesPaneCount + paneContentPaddingMarginAndBorderHeight);

                    return paneHeight + 'px';
                };

                scope.collapse = function(force) {
                    if(force) {
                        scope.isActive = false;
                    } else {
                        scope.isActive = !scope.isActive;
                    }

                    if(scope.isActive) {
                        angular.forEach(scope.MessageBus.accordionPaneScopes, function(iteratedScope, index) {
                            iteratedScope.collapse(true);
                        });

                        scope.isActive = true;

                        var paneContainerJqLite = element;
                        var paneTitleJqLite = angular.element(element.children()[0]);
                        var paneContentJqLite = angular.element(element.children()[1]);

                        var paneHeight = scope.calculatePaneContentHeight(paneContainerJqLite, paneTitleJqLite, paneContentJqLite);
                        paneContentJqLite.css('height', paneHeight);
                    }
                }
            },
            scope: {
                title: '@'
            }
        };
    });
