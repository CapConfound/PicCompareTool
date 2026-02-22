import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readStore, writeStore, Group } from '../store.js';

export const groupsRouter = Router();

const COLORS = [
  'blue', 'green', 'rose', 'amber', 'violet',
  'teal', 'orange', 'pink', 'cyan', 'lime',
];

groupsRouter.get('/groups', (_req, res) => {
  const store = readStore();
  res.json({ groups: store.groups });
});

groupsRouter.post('/groups', (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const store = readStore();
  const color = COLORS[store.groups.length % COLORS.length];
  const now = new Date().toISOString();

  const group: Group = {
    id: nanoid(),
    name: name.trim(),
    color,
    photos: { A: [], B: [] },
    selection: { A: null, B: null },
    createdAt: now,
    updatedAt: now,
  };

  store.groups.push(group);
  writeStore(store);
  res.status(201).json({ group });
});

groupsRouter.patch('/groups/:id', (req, res) => {
  const store = readStore();
  const group = store.groups.find(g => g.id === req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { name, color } = req.body as { name?: string; color?: string };
  if (name !== undefined) group.name = name.trim();
  if (color !== undefined) group.color = color;
  group.updatedAt = new Date().toISOString();

  writeStore(store);
  res.json({ group });
});

groupsRouter.delete('/groups/:id', (req, res) => {
  const store = readStore();
  const idx = store.groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  store.groups.splice(idx, 1);
  writeStore(store);
  res.json({ ok: true });
});

// Add photos to a group
groupsRouter.post('/groups/:id/photos', (req, res) => {
  const store = readStore();
  const group = store.groups.find(g => g.id === req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { phone, filenames } = req.body as { phone?: 'A' | 'B'; filenames?: string[] };
  if (!phone || (phone !== 'A' && phone !== 'B') || !Array.isArray(filenames)) {
    res.status(400).json({ error: 'phone (A|B) and filenames[] are required' });
    return;
  }

  const existing = new Set(group.photos[phone]);
  for (const f of filenames) {
    if (!existing.has(f)) {
      group.photos[phone].push(f);
      existing.add(f);
    }
  }
  group.updatedAt = new Date().toISOString();

  writeStore(store);
  res.json({ group });
});

// Remove photos from a group
groupsRouter.delete('/groups/:id/photos', (req, res) => {
  const store = readStore();
  const group = store.groups.find(g => g.id === req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { phone, filenames } = req.body as { phone?: 'A' | 'B'; filenames?: string[] };
  if (!phone || (phone !== 'A' && phone !== 'B') || !Array.isArray(filenames)) {
    res.status(400).json({ error: 'phone (A|B) and filenames[] are required' });
    return;
  }

  const toRemove = new Set(filenames);
  group.photos[phone] = group.photos[phone].filter(f => !toRemove.has(f));

  // Clear selection if the selected photo was removed
  if (group.selection[phone] && toRemove.has(group.selection[phone]!)) {
    group.selection[phone] = null;
  }
  group.updatedAt = new Date().toISOString();

  writeStore(store);
  res.json({ group });
});

// Set best pick selection
groupsRouter.post('/groups/:id/selection', (req, res) => {
  const store = readStore();
  const group = store.groups.find(g => g.id === req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const { phone, filename } = req.body as { phone?: 'A' | 'B'; filename?: string | null };
  if (!phone || (phone !== 'A' && phone !== 'B')) {
    res.status(400).json({ error: 'phone (A|B) is required' });
    return;
  }

  group.selection[phone] = filename ?? null;
  group.updatedAt = new Date().toISOString();

  writeStore(store);
  res.json({ group });
});
