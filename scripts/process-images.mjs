import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const inputDir = path.join(rootDir, 'content-assets', 'incoming-images');
const processedDir = path.join(rootDir, 'content-assets', 'processed-images');
const imageOutputDir = path.join(processedDir, 'images');
const thumbOutputDir = path.join(imageOutputDir, 'thumb');
const recordsPath = path.join(processedDir, 'manifest-images.json');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png']);
const webpQuality = 82;

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function toMonthParts(date) {
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
  };
}

async function processImage(filePath) {
  const source = await readFile(filePath);
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
  const sourceStat = await stat(filePath);
  const createdAt = sourceStat.mtime.toISOString();
  const { year, month } = toMonthParts(sourceStat.mtime);
  const mainRelativePath = path.posix.join('images', year, month, `${hash}.webp`);
  const thumbRelativePath = path.posix.join('images', 'thumb', `${hash}_400w.webp`);
  const mainOutputPath = path.join(processedDir, ...mainRelativePath.split('/'));
  const thumbOutputPath = path.join(processedDir, ...thumbRelativePath.split('/'));

  await mkdir(path.dirname(mainOutputPath), { recursive: true });
  await mkdir(path.dirname(thumbOutputPath), { recursive: true });

  const image = sharp(source, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions: ${path.relative(rootDir, filePath)}`);
  }

  await image.clone().webp({ quality: webpQuality }).toFile(mainOutputPath);
  await image.clone().resize({ width: 400, withoutEnlargement: true }).webp({ quality: webpQuality }).toFile(thumbOutputPath);

  const mainStat = await stat(mainOutputPath);

  return {
    hash,
    url: `/${mainRelativePath}`,
    thumbnailUrl: `/${thumbRelativePath}`,
    width: metadata.width,
    height: metadata.height,
    format: 'webp',
    size: mainStat.size,
    createdAt,
  };
}

await mkdir(inputDir, { recursive: true });
await mkdir(imageOutputDir, { recursive: true });
await mkdir(thumbOutputDir, { recursive: true });

const inputFiles = await collectFiles(inputDir);
const supportedFiles = [];
const skippedFiles = [];

for (const filePath of inputFiles) {
  const extension = path.extname(filePath).toLowerCase();

  if (supportedExtensions.has(extension)) {
    supportedFiles.push(filePath);
  } else {
    skippedFiles.push(filePath);
  }
}

const recordsByHash = new Map();

for (const filePath of supportedFiles) {
  const record = await processImage(filePath);
  recordsByHash.set(record.hash, record);
}

const records = [...recordsByHash.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
await writeFile(recordsPath, `${JSON.stringify({ version: 1, images: records }, null, 2)}\n`, 'utf8');

for (const skippedFile of skippedFiles) {
  console.warn(`Skipped unsupported file: ${path.relative(rootDir, skippedFile)}`);
}

console.log(`Processed ${records.length} image(s). Metadata written to content-assets/processed-images/manifest-images.json.`);
