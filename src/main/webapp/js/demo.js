angular.module('accordionApp', ['angular-accordion'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/:accordionPane', {
            controller: 'accordionRouteController',
            template: '<div></div>'
        });
    }])
    .controller('accordionBehaviorController', ['$scope', function($scope) {
        var enabled = false;

        $scope.paneEnabled = function() {
            return enabled;
        };

        $scope.enablePane = function() {
            enabled = !enabled;
        }
    }])
    .controller('accordionRouteController', ['$scope', '$location', '$routeParams', '$rootScope', function($scope, $location, $routeParams, $rootScope) {
        var accordionPane = 'header-1';

        if(typeof($routeParams.accordionPane) !== 'undefined') {
            accordionPane = $routeParams.accordionPane;
        }

        $rootScope.$broadcast('expand', accordionPane);

        $rootScope.$on('angular-accordion-expand', function(event, eventArguments) {
            $location.path(eventArguments);
        });
    }]);