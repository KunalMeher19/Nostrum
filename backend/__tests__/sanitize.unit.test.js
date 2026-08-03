// Unit tests for the injection guards.
const {
  stripOperators,
  escapeRegex,
} = require('../src/middlewares/sanitize.middleware');

describe('stripOperators', () => {
  it('drops $-prefixed and dotted keys at every depth', () => {
    const dirty = {
      name: 'Marta',
      $set: { role: 'admin' },
      'shipping.country': 'ES',
      shipping: {
        city: 'Girona',
        $where: 'sleep(1000)',
        nested: [{ ok: 1, $gt: '' }],
      },
    };
    expect(stripOperators(dirty)).toEqual({
      name: 'Marta',
      shipping: { city: 'Girona', nested: [{ ok: 1 }] },
    });
  });

  it('leaves scalars, arrays and null alone', () => {
    expect(stripOperators('x')).toBe('x');
    expect(stripOperators(null)).toBe(null);
    expect(stripOperators([1, 'a'])).toEqual([1, 'a']);
  });
});

describe('escapeRegex', () => {
  it('escapes every regex metacharacter', () => {
    const hostile = '(a+)+$^.*?[]{}|\\';
    const safe = escapeRegex(hostile);
    // Must compile and match itself literally.
    expect(new RegExp(safe).test(hostile)).toBe(true);
  });

  it('leaves normal search terms readable', () => {
    expect(escapeRegex('NST-2026')).toBe('NST-2026');
  });
});
