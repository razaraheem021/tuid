'use strict';

const { tuid, tuidTime, tuidCompare, isTuid, EPOCH } = require('./index.js');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    failed++;
  }
}

// ─── 1. Format ───────────────────────────────────────────────────────────────
console.log('\n── Format ──');
const id = tuid();
assert('generates a string',        typeof id === 'string');
assert('exactly 14 characters',     id.length === 14);
assert('only base62 chars',         /^[0-9A-Za-z]{14}$/.test(id));
assert('isTuid returns true',       isTuid(id));
assert('isTuid rejects short str',  !isTuid('abc'));
assert('isTuid rejects bad chars',  !isTuid('!!!!!!!!!!!!!!'));

// ─── 2. Uniqueness ───────────────────────────────────────────────────────────
console.log('\n── Uniqueness ──');
const N = 100_000;
const set = new Set();
for (let i = 0; i < N; i++) set.add(tuid());
assert(`${N.toLocaleString()} IDs — all unique`, set.size === N);

// ─── 3. Time extraction ──────────────────────────────────────────────────────
console.log('\n── Time extraction ──');
const before = Date.now();
const tid    = tuid();
const after  = Date.now();
const t      = tuidTime(tid).getTime();

assert('tuidTime returns a Date',             tuidTime(tid) instanceof Date);
assert('extracted time >= before generation', t >= before);
assert('extracted time <= after  generation', t <= after);
assert('throws on invalid input',             (() => { try { tuidTime('bad'); return false; } catch { return true; } })());

// ─── 4. Monotonic / sort order ───────────────────────────────────────────────
console.log('\n── Sort order ──');
const ids = [];
for (let i = 0; i < 1000; i++) ids.push(tuid());
const sorted = [...ids].sort(tuidCompare);
assert('sort is stable across 1 000 IDs', JSON.stringify(ids) === JSON.stringify(sorted));

// ─── 5. Collision stress (same ms) ───────────────────────────────────────────
console.log('\n── Same-millisecond collision stress ──');
const burst = new Set();
for (let i = 0; i < 10_000; i++) burst.add(tuid());
assert('10 000 burst IDs — all unique', burst.size === 10_000);

// ─── 6. Performance ──────────────────────────────────────────────────────────
console.log('\n── Performance ──');
const PERF = 500_000;
const t0 = process.hrtime.bigint();
for (let i = 0; i < PERF; i++) tuid();
const t1   = process.hrtime.bigint();
const ms   = Number(t1 - t0) / 1e6;
const rate = Math.round(PERF / (ms / 1000)).toLocaleString();
console.log(`     ${PERF.toLocaleString()} IDs generated in ${ms.toFixed(1)} ms  →  ${rate} IDs/sec`);
assert('generates > 1M IDs/sec', PERF / (ms / 1000) > 1_000_000);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed  |  ${failed} failed\n`);
if (failed > 0) process.exit(1);
