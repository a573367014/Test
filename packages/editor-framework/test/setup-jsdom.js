const { JSDOM } = require('jsdom');
const window = new JSDOM('<!DOCTYPE html>').window;
const document = window.document;

global.window = window;
global.document = document;
global.navigator = window.navigator;
