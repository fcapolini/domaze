
```bash
npm init -y
npm i -D esbuild
npm i -D @types/node
npm i -D vitest
npm i -D @vitest/coverage-v8
```

scripts/build.js

```js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/index.ts'], // Entry file
  outfile: './dist/index.js', // Output file
  bundle: true, // Bundle dependencies
  platform: 'node', // Target Node.js
  target: 'node16', // Specify Node.js version
  sourcemap: true, // Include sourcemaps
  minify: false, // Minify output for production
  loader: { '.ts': 'ts' }, // Add loader for TypeScript
}).then(() => {
  console.log('Build completed!');
}).catch(() => process.exit(1));
```

src/index.ts

```ts
// Example server code
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!');
});

server.listen(3000, () => {
  console.log('Server running at <http://localhost:3000/>');
});
```

test/dummy.test.ts

```ts
import { describe, it, expect } from 'vitest';

describe('Sample Test', () => {
  it('adds numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

package.json -> scripts

```json
    "test": "vitest --run",
    "coverage": "vitest --run --coverage",
    "start": "node dist/index.js",
    "build": "node scripts/build.js"
```

.editorconfig

```
# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```
