import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceDir = path.join(rootDir, 'content-assets', 'processed-images', 'images');
const targetDir = path.join(rootDir, 'dist', 'images');

await mkdir(sourceDir, { recursive: true });
await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true, force: true });

console.log('Copied processed images to dist/images/.');
