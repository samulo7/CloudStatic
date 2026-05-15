import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const processedManifestPath = path.join(rootDir, 'content-assets', 'processed-images', 'manifest-images.json');
const publicDir = path.join(rootDir, 'public');
const publicManifestPath = path.join(publicDir, 'manifest.json');
const emptyManifest = { version: 1, images: [] };

async function readProcessedManifest() {
  try {
    const raw = await readFile(processedManifestPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.images)) {
      throw new Error('Processed manifest must contain an images array.');
    }

    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return emptyManifest;
    }

    throw error;
  }
}

const processedManifest = await readProcessedManifest();
const imagesByHash = new Map();

for (const image of processedManifest.images) {
  imagesByHash.set(image.hash, image);
}

const manifest = {
  version: 1,
  images: [...imagesByHash.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
};

await mkdir(publicDir, { recursive: true });
await writeFile(publicManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Generated public/manifest.json with ${manifest.images.length} image(s).`);
