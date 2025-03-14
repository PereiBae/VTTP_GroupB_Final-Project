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

// Buffer polyfill - safer version that doesn't use require()
try {
  // Don't use require - this is loaded via Angular's bundling system instead
  (window as any).Buffer = (window as any).Buffer || [];
} catch (e) {
  console.warn('Buffer polyfill error:', e);
}
