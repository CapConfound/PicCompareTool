import fs from 'fs';
import path from 'path';
import { DATA_DIR } from './config.js';

const STORE_PATH = path.join(DATA_DIR, 'groups.json');
const TMP_PATH = STORE_PATH + '.tmp';

export interface Group {
  id: string;
  name: string;
  color: string;
  photos: {
    A: string[];
    B: string[];
  };
  selection: {
    A: string | null;
    B: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RankEntry {
  groupId: string;
  winner: 'A' | 'B';
}

export interface Store {
  version: 1;
  groups: Group[];
  ranking: RankEntry[];
}

let cache: Store | null = null;

export function readStore(): Store {
  if (cache) return cache;
  if (!fs.existsSync(STORE_PATH)) {
    cache = { version: 1, groups: [], ranking: [] };
    return cache;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as Store;
    // backward compat: old files may not have ranking
    cache = { ...raw, ranking: raw.ranking ?? [] };
    return cache;
  } catch {
    cache = { version: 1, groups: [], ranking: [] };
    return cache;
  }
}

export function writeStore(store: Store): void {
  cache = store;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TMP_PATH, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(TMP_PATH, STORE_PATH);
}
