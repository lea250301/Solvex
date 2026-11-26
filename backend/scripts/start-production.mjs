import { readFile } from 'node:fs/promises';

// This manifest travels with the compiled artifact, so health reports the source
// revision rather than the separate commit containing generated deployment files.
const release = JSON.parse(await readFile(new URL('../../release.json', import.meta.url), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(release.sourceRevision)) {
  throw new Error('Invalid source revision in release.json');
}
process.env.APP_REVISION = release.sourceRevision;
process.env.SERVE_FRONTEND = 'true';
await import('./migrate.mjs');
await import('../dist/server.js');
