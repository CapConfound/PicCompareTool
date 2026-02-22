import { Router } from 'express';
import { readStore, writeStore } from '../store.js';
import type { RankEntry } from '../store.js';

export const rankingRouter = Router();

rankingRouter.get('/ranking', (_req, res) => {
  const store = readStore();
  res.json({ ranking: store.ranking ?? [] });
});

rankingRouter.put('/ranking', (req, res) => {
  const { ranking } = req.body as { ranking: RankEntry[] };
  if (!Array.isArray(ranking)) {
    res.status(400).json({ error: 'ranking must be an array' });
    return;
  }
  const store = readStore();
  writeStore({ ...store, ranking });
  res.json({ ok: true, ranking });
});
