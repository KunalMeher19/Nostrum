const fs = require('fs');
const buf = fs.readFileSync('C:/Users/ardhe/Downloads/Nostrum feedback.3.pdf');
const text = buf.toString('latin1');

const results = [];
let i = 0;
while (i < text.length) {
  if (text[i] === '(') {
    let s = '';
    i++;
    let depth = 1;
    while (i < text.length && depth > 0) {
      const ch = text[i];
      if (ch === String.fromCharCode(92)) { i += 2; continue; } // backslash escape
      if (ch === '(') depth++;
      if (ch === ')') { depth--; if (depth === 0) { i++; break; } }
      s += ch;
      i++;
    }
    if (/[a-zA-Z ]{4,}/.test(s) && s.length < 600) {
      const cleaned = s.replace(/[^\x20-\x7E]/g, '').trim();
      if (cleaned.length > 6) results.push(cleaned);
    }
  } else {
    i++;
  }
}

const seen = new Set();
const clean = results.filter(s => {
  const k = s.toLowerCase().replace(/\s+/g, '');
  if (seen.has(k)) return false;
  seen.add(k);
  if (/^(stream|endobj|null|true|false)$/i.test(s.trim())) return false;
  return /[a-zA-Z]{4,}/.test(s);
});

console.log(clean.join('\n'));
