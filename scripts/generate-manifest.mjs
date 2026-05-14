import { mkdir, writeFile } from 'node:fs/promises';

const manifestUrl = new URL('../public/manifest.json', import.meta.url);
const manifest = {
  version: 1,
  images: [],
};

await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log('Generated public/manifest.json with empty image manifest.');
