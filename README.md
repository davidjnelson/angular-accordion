angular-accordion
=================

An angular accordion which auto stretches to its container height and width while debouncing height recalculation on resize.  Works in modern browsers and IE9+.

Usage:

1) include jquery
2) include angular
3) include angular-accordion.js
4) include angular-accordion.css
5) put the following markup in your template: 

<div data-ng-app="demo" style="height: 100%; width: 100%; position: absolute;" id="angular-accordion-container">
  <div data-angular-accordion data-on-collapsed="angularAccordionDemoOnCollapsedHandler">
      <div data-angular-accordion-pane data-title="Pane 1">
          Content 1
      </div>
      <div data-angular-accordion-pane data-title="Pane 2">Content 2</div>
      <div data-angular-accordion-pane data-title="Pane 3">
          Content 3
      </div>
      <div data-angular-accordion-pane data-title="Pane 4">
          Content 4
      </div>
  </div>
</div>

Demo:

http://angular-accordion.s3-website-us-east-1.amazonaws.com/
