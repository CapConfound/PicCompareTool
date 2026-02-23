import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// In the packaged Electron app, PICCOMPARE_DATA_DIR is set to app.getPath('userData')/data
// before the server module is imported. In dev mode the env var is absent, so we fall back
// to the repo's own data/ directory.
export const DATA_DIR =
  process.env.PICCOMPARE_DATA_DIR ?? path.resolve(__dirname, '../../data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

export interface Config {
  phoneA: string;
  phoneB: string;
  phoneAName?: string;
  phoneBName?: string;
}

export function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'thumbnails'), { recursive: true });
}

export function readConfig(): Config | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as Config;
  } catch {
    return null;
  }
}

export function writeConfig(config: Config): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

export function getPhonePath(phone: 'A' | 'B'): string | null {
  const config = readConfig();
  if (!config) return null;
  return phone === 'A' ? config.phoneA : config.phoneB;
}
