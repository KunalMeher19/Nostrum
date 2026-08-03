// Jest stand-in for `jose` (ESM-only, so Jest's CJS runtime can't load
// the real package). Real JWE decryption is exercised against the live
// servers; here tests mint sessions as `test.<base64url JSON payload>`
// via test/helpers.js sessionCookie().
exports.jwtDecrypt = async (token) => {
  if (typeof token === 'string' && token.startsWith('test.')) {
    const payload = JSON.parse(
      Buffer.from(token.slice(5), 'base64url').toString('utf8')
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('"exp" claim timestamp check failed');
    }
    return { payload, protectedHeader: { alg: 'dir', enc: 'A256CBC-HS512' } };
  }
  throw new Error('decryption operation failed');
};
