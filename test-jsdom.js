const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM('<!DOCTYPE html><p>Test</p>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
};

const code = fs.readFileSync('scripts.js', 'utf8');

try {
  eval(code);
  console.log('Script executed successfully. loginGoogle type:', typeof loginGoogle);
} catch (e) {
  console.error('ERROR CAUGHT!!!');
  console.error(e.stack);
}
