import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DATA_DIR } from './config.js';

const execFileAsync = promisify(execFile);
const CACHE_DIR = path.join(DATA_DIR, 'thumbnails');

// In-flight deduplication: prevents spawning multiple sips for the same file
const inFlight = new Map<string, Promise<string>>();

function getCachePath(filePath: string, size: number): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${filePath}:${size}`)
    .digest('hex')
    .slice(0, 16);
  return path.join(CACHE_DIR, `${hash}-${size}.jpg`);
}

async function generateThumbnail(filePath: string, size: number): Promise<string> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = getCachePath(filePath, size);

  // Defensive: ensure sips output can never land outside the cache directory
  const resolvedCache = path.resolve(cachePath);
  const resolvedCacheDir = path.resolve(CACHE_DIR);
  if (!resolvedCache.startsWith(resolvedCacheDir + path.sep)) {
    throw new Error(`Thumbnail output path escapes cache directory: ${cachePath}`);
  }

  if (fs.existsSync(cachePath)) {
    return cachePath;
  }

  // sips is macOS built-in: handles DNG, HEIC, JPEG natively via Core Image
  // -Z: fit within size×size maintaining aspect ratio
  // -s format jpeg: output as JPEG
  await execFileAsync('sips', [
    '-s', 'format', 'jpeg',
    '-Z', String(size),
    filePath,
    '--out', cachePath,
  ]);

  if (!fs.existsSync(cachePath)) {
    throw new Error(`sips did not produce output for: ${filePath}`);
  }

  return cachePath;
}

export function getThumbnail(filePath: string, size: number): Promise<string> {
  const key = `${filePath}:${size}`;

  if (inFlight.has(key)) {
    return inFlight.get(key)!;
  }

  const promise = generateThumbnail(filePath, size).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}
