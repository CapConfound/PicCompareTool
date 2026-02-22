import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getPhonePath } from '../config.js';
import { getThumbnail } from '../thumbnails.js';

export const imagesRouter = Router();

imagesRouter.get('/thumbnail', async (req, res) => {
  const { phone, filename, size: sizeStr } = req.query as {
    phone?: string;
    filename?: string;
    size?: string;
  };

  if (!phone || (phone !== 'A' && phone !== 'B') || !filename) {
    res.status(400).json({ error: 'phone (A|B) and filename are required' });
    return;
  }

  const phonePath = getPhonePath(phone as 'A' | 'B');
  if (!phonePath) {
    res.status(400).json({ error: 'Config not set' });
    return;
  }

  const size = parseInt(sizeStr ?? '200', 10);
  if (isNaN(size) || size < 50 || size > 3000) {
    res.status(400).json({ error: 'size must be between 50 and 3000' });
    return;
  }

  // Prevent path traversal
  const filePath = path.resolve(phonePath, filename);
  if (!filePath.startsWith(path.resolve(phonePath))) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  try {
    // getThumbnail() reads filePath as input and writes only to data/thumbnails/ (never to phone folders)
    const cachePath = await getThumbnail(filePath, size);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(cachePath).pipe(res);
  } catch (err) {
    console.error('Thumbnail error:', err);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});
