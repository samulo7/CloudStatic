import { access } from 'node:fs/promises';

const inputDir = new URL('../content-assets/incoming-images/', import.meta.url);

try {
  await access(inputDir);
  console.log('No image processing implemented in Step 1. Input directory exists; no files processed.');
} catch {
  console.log('No image processing implemented in Step 1. No input directory found; nothing to process.');
}
