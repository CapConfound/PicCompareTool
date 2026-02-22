export interface Config {
  phoneA: string;
  phoneB: string;
  phoneAName?: string;
  phoneBName?: string;
}

export interface FileInfo {
  filename: string; // relative to phone root
  size: number;
  mtime: string;
}

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

export type Phone = 'A' | 'B';

export interface RankEntry {
  groupId: string;
  winner: Phone;
}
