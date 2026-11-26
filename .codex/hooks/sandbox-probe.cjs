// Run only through `codex sandbox -P solvex` after creating the documented
// non-secret .codex/.env.canary fixture. Never reads an actual environment file.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
try {
  fs.readFileSync(path.join(root, 'README.md'), 'utf8');
} catch (error) {
  console.error(`Project documentation is unexpectedly unavailable: ${error.code}`);
  process.exit(1);
}
try {
  fs.readFileSync(path.join(root, '.codex/.env.canary'), 'utf8');
  console.error('FAIL: sandbox allowed reading the non-secret deny-read canary.');
  process.exitCode = 1;
} catch (error) {
  if (['EACCES', 'EPERM'].includes(error.code)) {
    console.log(`PASS: project documentation readable; deny-read canary blocked (${error.code}).`);
  } else {
    console.error(`Probe inconclusive: ${error.code}; create the canary before testing.`);
    process.exitCode = 1;
  }
}
