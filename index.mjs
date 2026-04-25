// v2.1.1 - 16-char IDs with masked time+seq (seq leak fixed)
//
// Format: [7 masked-time][3 masked-seq][6 random-key]
//
// Time masking:  out_time[i] = CHARS[ (time_digit[i] + rD[i % 6]) % 62 ]
// Seq masking:   out_seq[i]  = CHARS[ (seq_digit[i]  + seqKey[i]) % 62 ]
//   where seqKey[i] = (rD[i % 6] + rD[(i + 3) % 6] + 1) % 62
//
// All 16 output chars look fully random to an observer.
// tuidTime / tuidCompare unmask internally before decoding.
// No extra characters. Same CSPRNG pool. Same throughput.

var CHARS    = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
var BASE     = 62;
var SEQ_MAX  = 238328;
var RAND6MAX = 56800235584;

var _DECODE = new Uint8Array(128).fill(255);
for (var _i = 0; _i < 62; _i++) _DECODE[CHARS.charCodeAt(_i)] = _i;

var _POOL_SIZE = 1024;
var _hasCrypto = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
var _pool      = _hasCrypto ? new Uint8Array(_POOL_SIZE) : null;
var _poolPos   = _POOL_SIZE;

function _refill() {
  crypto.getRandomValues(_pool);
  _poolPos = 0;
}

function _rand48() {
  if (_hasCrypto) {
    if (_poolPos + 6 > _POOL_SIZE) _refill();
    var hi = (_pool[_poolPos] << 8 | _pool[_poolPos + 1]) & 0xffff;
    var lo = (_pool[_poolPos + 2] << 24 |
              _pool[_poolPos + 3] << 16 |
              _pool[_poolPos + 4] <<  8 |
              _pool[_poolPos + 5]) >>> 0;
    _poolPos += 6;
    return hi * 4294967296 + lo;
  }
  return Math.floor(Math.random() * 65536) * 4294967296 +
         Math.floor(Math.random() * 4294967296);
}

function _digitArray(n, width) {
  var arr = new Array(width);
  for (var i = width - 1; i >= 0; i--) {
    arr[i] = n % BASE;
    n = Math.floor(n / BASE);
  }
  return arr;
}

var _lastMs = -1;
var _seq    = 0;

function tuid() {
  var ms = Date.now();
  if (ms === _lastMs) {
    _seq = (_seq + 1) % SEQ_MAX;
  } else {
    _seq    = 0;
    _lastMs = ms;
  }

  var r  = _rand48() % RAND6MAX;
  var rD = _digitArray(r, 6);

  var tD  = _digitArray(ms, 7);
  var out = '';
  for (var i = 0; i < 7; i++) {
    out += CHARS[(tD[i] + rD[i % 6]) % BASE];
  }

  var sD = _digitArray(_seq, 3);
  for (var i = 0; i < 3; i++) {
    var seqKey = (rD[i % 6] + rD[(i + 3) % 6] + 1) % BASE;
    out += CHARS[(sD[i] + seqKey) % BASE];
  }

  out += CHARS[rD[0]] + CHARS[rD[1]] + CHARS[rD[2]] +
         CHARS[rD[3]] + CHARS[rD[4]] + CHARS[rD[5]];

  return out;
}

function tuidTime(id) {
  if (typeof id !== 'string' || id.length !== 16) {
    throw new TypeError('tuidTime: argument must be a 16-char tuid string');
  }
  var rD = new Array(6);
  for (var i = 0; i < 6; i++) {
    var code = id.charCodeAt(10 + i);
    var d    = code < 128 ? _DECODE[code] : 255;
    if (d === 255) throw new TypeError('tuidTime: invalid character at position ' + (10 + i));
    rD[i] = d;
  }
  var ms = 0;
  for (var i = 0; i < 7; i++) {
    var code   = id.charCodeAt(i);
    var masked = code < 128 ? _DECODE[code] : 255;
    if (masked === 255) throw new TypeError('tuidTime: invalid character at position ' + i);
    ms = ms * BASE + (masked - rD[i % 6] + BASE) % BASE;
  }
  return new Date(ms);
}

function tuidCompare(a, b) {
  function unpack(id) {
    var rD = new Array(6);
    for (var i = 0; i < 6; i++) rD[i] = _DECODE[id.charCodeAt(10 + i)];
    var ms = 0;
    for (var i = 0; i < 7; i++) ms = ms * BASE + (_DECODE[id.charCodeAt(i)] - rD[i % 6] + BASE) % BASE;
    var sq = 0;
    for (var i = 0; i < 3; i++) {
      var seqKey = (rD[i % 6] + rD[(i + 3) % 6] + 1) % BASE;
      sq = sq * BASE + (_DECODE[id.charCodeAt(7 + i)] - seqKey + BASE) % BASE;
    }
    return ms * SEQ_MAX + sq;
  }
  var va = unpack(a), vb = unpack(b);
  return va < vb ? -1 : va > vb ? 1 : 0;
}

function isTuid(id) {
  if (typeof id !== 'string' || id.length !== 16) return false;
  for (var i = 0; i < 16; i++) {
    var code = id.charCodeAt(i);
    if (code > 127 || _DECODE[code] === 255) return false;
  }
  return true;
}

export default tuid;
export { tuid };
export { tuidTime };
export { tuidCompare };
export { isTuid };
