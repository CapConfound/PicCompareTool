import { Router } from 'express';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readConfig, writeConfig } from '../config.js';

const execFileAsync = promisify(execFile);

export const configRouter = Router();

configRouter.get('/config', (_req, res) => {
  const config = readConfig();
  if (!config) {
    res.status(404).json({ error: 'No config found' });
    return;
  }
  res.json(config);
});

configRouter.post('/config', (req, res) => {
  const { phoneA, phoneB, phoneAName, phoneBName } = req.body as {
    phoneA?: string;
    phoneB?: string;
    phoneAName?: string;
    phoneBName?: string;
  };

  if (!phoneA?.trim() || !phoneB?.trim()) {
    res.status(400).json({ error: 'phoneA and phoneB are required' });
    return;
  }

  if (!fs.existsSync(phoneA)) {
    res.status(400).json({ error: `Path does not exist: ${phoneA}` });
    return;
  }

  if (!fs.existsSync(phoneB)) {
    res.status(400).json({ error: `Path does not exist: ${phoneB}` });
    return;
  }

  writeConfig({
    phoneA: phoneA.trim(),
    phoneB: phoneB.trim(),
    ...(phoneAName?.trim() ? { phoneAName: phoneAName.trim() } : {}),
    ...(phoneBName?.trim() ? { phoneBName: phoneBName.trim() } : {}),
  });
  res.json({ ok: true });
});

// Opens a native macOS folder picker dialog and returns the chosen path
configRouter.post('/browse-folder', async (req, res) => {
  const { prompt } = req.body as { prompt?: string };
  const promptText = (prompt ?? 'Select a folder').replace(/"/g, '\\"');

  try {
    const { stdout } = await execFileAsync('osascript', [
      // Bring Finder to front so the dialog appears above the browser window
      '-e', 'tell application "Finder" to activate',
      '-e', 'delay 0.2',
      '-e', `return POSIX path of (choose folder with prompt "${promptText}")`,
    ]);
    res.json({ path: stdout.trim() });
  } catch (err) {
    // User cancelled the dialog — not an error
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('User canceled') || msg.includes('-128')) {
      res.json({ path: null });
    } else {
      console.error('osascript error:', err);
      res.status(500).json({ error: 'Folder picker failed. Make sure Terminal has Automation permission in System Settings → Privacy & Security → Automation.' });
    }
  }
});
