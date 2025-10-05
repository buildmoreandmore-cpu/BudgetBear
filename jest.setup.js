// Setup file for Jest tests
// Polyfill for PDF parsing in Node environment

const { createCanvas } = require('canvas');
const { config } = require('dotenv');

// Load environment variables from .env.local
config({ path: '.env.local' });

// Polyfill DOMMatrix for pdf-parse
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
};

// Create a simple canvas for PDF rendering
if (typeof global.document === 'undefined') {
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        return createCanvas(200, 200);
      }
      return {};
    }
  };
}
