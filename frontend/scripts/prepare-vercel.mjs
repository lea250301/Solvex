import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const output = new URL('../.vercel/output/', import.meta.url);
await readFile(new URL('index.html', dist)); // Fail if the build artifact is absent.

const origin = process.env.BACKEND_ORIGIN?.trim();
let apiRoute;
if (origin) {
  const backend = new URL(origin);
  if (backend.protocol !== 'https:' || backend.username || backend.password ||
      backend.pathname !== '/' || backend.search || backend.hash) {
    throw new Error('BACKEND_ORIGIN must be a public HTTPS origin, without a path or credentials.');
  }
  apiRoute = { src: '^/api(?:/(.*))?$', dest: `${backend.origin}/api/$1` };
} else {
  apiRoute = {
    src: '^/api(?:/.*)?$',
    dest: '/api-unavailable.json',
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  };
}

await mkdir(new URL('static/', output), { recursive: true });
await cp(dist, new URL('static/', output), { recursive: true, force: true });
await writeFile(new URL('static/api-unavailable.json', output), JSON.stringify({
  message: 'Backend še ni nameščen. Objavljen je samo uporabniški vmesnik.',
}) + '\n');
await writeFile(new URL('config.json', output), JSON.stringify({
  version: 3,
  routes: [
    apiRoute,
    { handle: 'filesystem' },
    { src: '/.*', dest: '/index.html' },
  ],
}, null, 2) + '\n');
console.log(`Vercel prebuilt package prepared. API: ${origin || 'not connected yet'}`);
