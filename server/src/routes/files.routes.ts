import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getPhonePath } from '../config.js';

export const filesRouter = Router();

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.heic', '.heif', '.png', '.dng', '.raw', '.arw', '.cr2', '.nef',
]);
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.3gp', '.avi', '.mkv', '.m4v', '.mts', '.m2ts', '.wmv',
]);

export interface FileInfo {
  filename: string; // relative to phone root
  size: number;
  mtime: string;
}

// In-memory cache: cleared on refresh
const fileListCache = new Map<string, FileInfo[]>();

function scanDirectory(dirPath: string): FileInfo[] {
  const results: FileInfo[] = [];

  function scan(currentPath: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext)) continue;
        if (!IMAGE_EXTENSIONS.has(ext)) continue;

        try {
          const stat = fs.statSync(fullPath);
          results.push({
            filename: path.relative(dirPath, fullPath),
            size: stat.size,
            mtime: stat.mtime.toISOString(),
          });
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  scan(dirPath);
  results.sort((a, b) => a.mtime.localeCompare(b.mtime));
  return results;
}

filesRouter.get('/files/:phone', (req, res) => {
  const phone = req.params.phone as 'A' | 'B';
  if (phone !== 'A' && phone !== 'B') {
    res.status(400).json({ error: 'phone must be A or B' });
    return;
  }

  const phonePath = getPhonePath(phone);
  if (!phonePath) {
    res.status(400).json({ error: 'Config not set — visit /setup first' });
    return;
  }

  if (!fs.existsSync(phonePath)) {
    res.status(400).json({ error: `Folder does not exist: ${phonePath}` });
    return;
  }

  const cacheKey = `${phone}:${phonePath}`;
  if (fileListCache.has(cacheKey)) {
    res.json({ files: fileListCache.get(cacheKey) });
    return;
  }

  const files = scanDirectory(phonePath);
  fileListCache.set(cacheKey, files);
  res.json({ files });
});

filesRouter.post('/files/:phone/refresh', (req, res) => {
  const phone = req.params.phone as 'A' | 'B';
  const phonePath = getPhonePath(phone);
  if (phonePath) {
    fileListCache.delete(`${phone}:${phonePath}`);
  }
  res.json({ ok: true });
});
