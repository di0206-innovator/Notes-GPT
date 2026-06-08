import dns from 'dns';

const originalLookup = dns.lookup;

// Monkey-patch dns.lookup to resolve Google API hostnames instantly.
// This bypasses slow/broken DNS resolvers in the sandbox environment.
dns.lookup = function (hostname, options, callback) {
  if (hostname === 'generativelanguage.googleapis.com') {
    const ip = '216.239.38.223';
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' ? options : {};
    
    if (opts.all) {
      return cb(null, [{ address: ip, family: 4 }]);
    }
    return cb(null, ip, 4);
  }
  return originalLookup.call(dns, hostname, options, callback);
} as any;

console.log('[DNS Patch] Applied instant lookup patch for generativelanguage.googleapis.com');
