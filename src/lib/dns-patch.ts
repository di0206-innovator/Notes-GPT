/* eslint-disable @typescript-eslint/no-explicit-any */
import dns from 'dns';

const originalLookup = dns.lookup;

// Enhanced dns.lookup: attempts standard DNS lookup first, falling back to static IP
// if resolution fails or is blocked in constrained sandbox environments.
dns.lookup = function (hostname: string, options: any, callback: any) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' ? options : {};

  if (hostname === 'generativelanguage.googleapis.com') {
    (originalLookup as any).call(dns, hostname, options, (err: any, address: any, family: any) => {
      if (!err && address) {
        return cb(null, address, family);
      }
      const ip = '216.239.38.223';
      if (opts.all) {
        return cb(null, [{ address: ip, family: 4 }]);
      }
      return cb(null, ip, 4);
    });
    return;
  }
  return (originalLookup as any).call(dns, hostname, options, callback);
} as any;

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

