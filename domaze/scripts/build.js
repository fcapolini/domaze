const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/cli.ts'], // Entry file
  outfile: './dist/cli.js', // Output file
  bundle: true, // Bundle dependencies
  platform: 'node', // Target Node.js
  target: 'node16', // Specify Node.js version
  sourcemap: true, // Include sourcemaps
  minify: false, // Minify output for production
  loader: { '.ts': 'ts' }, // Add loader for TypeScript
}).then(() => {
  console.log('Build completed!');
}).catch(() => process.exit(1));
