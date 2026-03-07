const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const scriptCode = fs.readFileSync('scripts.js', 'utf8');

const dom = new JSDOM(html, {
  url: "http://127.0.0.1:8080/",
  runScripts: "dangerously"
});

// Polyfill for IntersectionObserver
dom.window.IntersectionObserver = class IntersectionObserver {
  observe() { }
  unobserve() { }
};

try {
  dom.window.eval(scriptCode);
  console.log('Script executed. typeof loginGoogle:', typeof dom.window.loginGoogle);
} catch (e) {
  console.log('CRASH CAUGHT IN index.html CONTEXT!!!');
  console.log(e.stack);
}
