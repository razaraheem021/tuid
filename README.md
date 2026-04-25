# tuid

Tiny, time-linked unique IDs — 16 characters, base62, zero dependencies.

```
npm install tuid
```

---

## What you get

- **16 chars** — shorter than UUID (36) and nanoid (21)
- **Time-sortable** — `ORDER BY id` is chronological, no extra `created_at` column needed
- **Fast** — ~2M IDs/sec via a pooled CSPRNG (5x faster than nanoid/uuid)
- **Zero dependencies** — Node.js >= 14 and all modern browsers

---

## Install

```bash
npm install tuid
# yarn add tuid
# pnpm add tuid
```

---

## Usage

```js
// CommonJS
const tuid = require('tuid');

// ESM
import tuid from 'tuid';
import { tuid, tuidTime, tuidCompare, isTuid } from 'tuid';
```

### Generate an ID

```js
const id = tuid();
// "V3kQ8mN2pRx4Yw9Z"  — 16 base62 chars
```

### Database primary key

```js
// PostgreSQL
await db.query(
  'INSERT INTO orders (id, user_id, total) VALUES ($1, $2, $3)',
  [tuid(), userId, total]
);
```

```sql
CREATE TABLE orders (
  id      VARCHAR(16) PRIMARY KEY,
  user_id VARCHAR(16) NOT NULL,
  total   NUMERIC     NOT NULL
);

-- Chronological order via primary key — no created_at column needed
SELECT * FROM orders ORDER BY id DESC LIMIT 20;
```

### Extract the creation timestamp

```js
import { tuidTime } from 'tuid';

const id = tuid();
const createdAt = tuidTime(id); // returns a Date object

console.log(createdAt.toISOString()); // "2026-04-25T11:45:39.204Z"
```

### Sort chronologically

```js
import { tuidCompare } from 'tuid';

events.sort((a, b) => tuidCompare(a.id, b.id)); // oldest → newest
```

### Validate

```js
import { isTuid } from 'tuid';

isTuid("V3kQ8mN2pRx4Yw9Z")  // true
isTuid("bad")                 // false
```

### React list keys

Generate the ID when data is **created**, not inside `.map()`.

```jsx
// Stamp once at creation time
function addItem(text) {
  setItems(prev => [...prev, { id: tuid(), text }]);
}

// Stable key — React only diffs what changed
items.map(item => <li key={item.id}>{item.text}</li>)
```

---

## API

| Function | Returns | Description |
|---|---|---|
| `tuid()` | `string` | Generate a unique 16-char base62 ID |
| `tuidTime(id)` | `Date` | Extract the creation timestamp — throws on invalid input |
| `tuidCompare(a, b)` | `-1 \| 0 \| 1` | Chronological comparator for `.sort()` |
| `isTuid(id)` | `boolean` | Validate a 16-char base62 tuid |

---



## Comparison

| | tuid | nanoid | uuid v4 |
|---|---|---|---|
| Length | **16** | 21 | 36 |
| Time-sortable | **yes** | no | no |
| Timestamp extraction | **yes** | no | no |
| Throughput | **~2.1M/s** | ~370K/s | ~390K/s |
| Zero dependencies | yes | yes | yes |
| Browser support | yes | yes | yes |

---

## License

MIT
