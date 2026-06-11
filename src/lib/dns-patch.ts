/* eslint-disable @typescript-eslint/no-explicit-any */
import dns from 'dns';

const originalLookup = dns.lookup;

// Monkey-patch dns.lookup to resolve Google API hostnames instantly.
// This bypasses slow/broken DNS resolvers in the sandbox environment.
dns.lookup = function (hostname: string, options: any, callback: any) {
  if (hostname === 'generativelanguage.googleapis.com') {
    const ip = '216.239.38.223';
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' ? options : {};
    
    if (opts.all) {
      return cb(null, [{ address: ip, family: 4 }]);
    }
    return cb(null, ip, 4);
  }
  return (originalLookup as any).call(dns, hostname, options, callback);
} as any;

console.log('[DNS Patch] Applied instant lookup patch for generativelanguage.googleapis.com');

// Polyfill DOMMatrix globally for server-side environments (Node.js) where pdfjs-dist / pdf-parse requires it
if (typeof globalThis !== 'undefined' && !(globalThis as any).DOMMatrix) {
  class MockDOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: any) {
      if (Array.isArray(init)) {
        this.a = init[0] ?? 1;
        this.b = init[1] ?? 0;
        this.c = init[2] ?? 0;
        this.d = init[3] ?? 1;
        this.e = init[4] ?? 0;
        this.f = init[5] ?? 0;
      } else if (typeof init === 'object' && init !== null) {
        this.a = init.a ?? 1;
        this.b = init.b ?? 0;
        this.c = init.c ?? 0;
        this.d = init.d ?? 1;
        this.e = init.e ?? 0;
        this.f = init.f ?? 0;
      }
    }
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    translate() { return this; }
    scale() { return this; }
    invertSelf() { return this; }
    multiply() { return this; }
    preMultiply() { return this; }
    inverse() { return this; }
  }
  (globalThis as any).DOMMatrix = MockDOMMatrix;
  console.log('[DOMMatrix Polyfill] Registered MockDOMMatrix globally in globalThis');
}

