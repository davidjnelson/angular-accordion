// TODO: do this without a namespaced object in the global scope
var angularAccordionDemoOnCollapsedHandler = function() {
    console.log('an accordion pane was collapsed.');
};

angular.module('demo', ['angular-accordion']);
