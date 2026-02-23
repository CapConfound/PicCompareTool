import sharp from 'sharp';
import { exiftool } from 'exiftool-vendored';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DATA_DIR } from './config.js';

const CACHE_DIR = path.join(DATA_DIR, 'thumbnails');

// In-flight deduplication: prevents spawning multiple processes for the same file
const inFlight = new Map<string, Promise<string>>();

// File extensions that require embedded-JPEG extraction (RAW formats)
const RAW_EXTS = new Set(['.dng', '.raw', '.cr2', '.cr3', '.nef', '.arw', '.orf', '.rw2', '.raf']);

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

  // Defensive: ensure output can never land outside the cache directory
  const resolvedCache = path.resolve(cachePath);
  const resolvedCacheDir = path.resolve(CACHE_DIR);
  if (!resolvedCache.startsWith(resolvedCacheDir + path.sep)) {
    throw new Error(`Thumbnail output path escapes cache directory: ${cachePath}`);
  }

  if (fs.existsSync(cachePath)) {
    return cachePath;
  }

  const ext = path.extname(filePath).toLowerCase();

  if (RAW_EXTS.has(ext)) {
    // RAW/DNG: extract the embedded full-resolution JPEG preview, then resize.
    // Galaxy S25 and Pixel 6 DNG files always contain a full-res embedded JPEG.
    let jpgBuffer: Buffer;
    try {
      jpgBuffer = await exiftool.extractBinaryTagToBuffer('JpgFromRaw', filePath);
    } catch {
      // Some DNG files use PreviewImage instead of JpgFromRaw
      jpgBuffer = await exiftool.extractBinaryTagToBuffer('PreviewImage', filePath);
    }
    if (!jpgBuffer || jpgBuffer.length === 0) {
      throw new Error(`No embedded JPEG preview found in RAW file: ${filePath}`);
    }
    await sharp(jpgBuffer)
      .rotate()  // auto-rotate based on EXIF orientation
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(cachePath);
  } else {
    // JPEG / HEIC / PNG / WebP — sharp handles these natively via libvips + libheif
    await sharp(filePath)
      .rotate()  // auto-rotate based on EXIF orientation
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(cachePath);
  }

  if (!fs.existsSync(cachePath)) {
    throw new Error(`Thumbnail generation produced no output for: ${filePath}`);
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
