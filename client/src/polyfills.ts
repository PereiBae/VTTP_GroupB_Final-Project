/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Node.js global polyfill
(window as any).global = window;

// Process polyfill
(window as any).process = {
  env: { DEBUG: undefined },
  nextTick: function(cb: Function) { setTimeout(cb, 0); }
};

// Buffer polyfill
// This may be needed for some libraries that expect the Node.js Buffer
try {
  (window as any).Buffer = (window as any).Buffer || require('buffer').Buffer;
} catch (e) {
  console.warn('Buffer polyfill failed to load', e);
}
