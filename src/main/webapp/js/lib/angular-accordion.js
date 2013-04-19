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
            restrict: 'EA',
            template:
                '<div class="angular-accordion-container">' +
                    '<div class="angular-accordion-header" ng-click="collapse()" ng-class="{ angularaccordionheaderselected: isActive }">' +
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
                scope.previousStyles = {};

                var heightPaddingBorderMarginZeroed = {
                    'padding-top': '0px',
                    'padding-bottom': '0px',
                    'border-top': '0px',
                    'border-bottom': '0px',
                    'margin-top': '0px',
                    'margin-bottom': '0px',
                    'height': '0px'
                };

                var convertCssNumberToJavascriptNumber = function(cssNumber) {
                    if(typeof(cssNumber) === 'undefined') {
                        return 0;
                    }

                    return parseInt(cssNumber.split(' ')[0].replace('px', ''));
                };

                var getComputedStyleAsNumber = function(element, style) {
                    // TODO: remove the jquery dependency here by extracting the jquery or similar getComputedStyle implementation that works in IE9<
                    return convertCssNumberToJavascriptNumber($(element).css(style));
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

                var objectIsEmpty = function(object) {
                    for(var property in object) {
                        if(object.hasOwnProperty(property)) {
                            return false;
                        }
                    }

                    return true;
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
                        paneTitleOuterHeightTimesPaneCount + paneContentPaddingMarginAndBorderHeight)) - scope.previousContentPanePaddingMarginAndBorderHeight;

                    return paneHeight + 'px';
                };

                scope.collapse = function(force) {
                    var paneContentJqLite = angular.element(element.children()[1]);

                    // TODO: remove the dependency here on jquery for non IE10< by getting the new angular css based animation working
                    // TODO: extract only the jquery animation code from jquery for animating in IE9<
                    var paneContentJquery = $(element.children()[1]);

                    if(!scope.isActive && !force) {
                        angular.forEach(scope.MessageBus.accordionPaneScopes, function(iteratedScope) {
                            iteratedScope.collapse(true);
                        });

                        scope.isActive = true;

                        var paneContainerJqLite = element;
                        var paneTitleJqLite = angular.element(element.children()[0]);

                        var paneHeight = scope.calculatePaneContentHeight(paneContainerJqLite, paneTitleJqLite, paneContentJqLite);

                        paneContentJqLite.removeAttr('style');
                        paneContentJqLite.css('height', '0px');

                        paneContentJquery.animate({ height: paneHeight }, 100);
                    } else if(!force) {
                        scope.isActive = false;
                        paneContentJquery.animate(heightPaddingBorderMarginZeroed, 100);
                    } else {
                        scope.isActive = false;
                        paneContentJqLite.css(heightPaddingBorderMarginZeroed);
                    }
                };

                scope.previousContentPanePaddingMarginAndBorderHeight = getElementPaddingMarginAndBorderHeight(angular.element(element.children()[1]));

                scope.collapse(true);
            },
            scope: {
                title: '@'
            }
        };
    });
