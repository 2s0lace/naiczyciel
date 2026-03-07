const fs = require('fs');
// Mocking browser environment slightly to see if the script at least parses to the end without DOM queries crashing it immediately.
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

try {
  require('./scripts.js');
  console.log("Script executed without top-level errors! loginGoogle is now:", typeof window.loginGoogle !== 'undefined' || typeof global.loginGoogle !== 'undefined' ? 'defined' : 'not defined globally? Wait, it is a normal function, so it should be defined.');
} catch(e) {
  console.error("Still error:", e.message);
}
