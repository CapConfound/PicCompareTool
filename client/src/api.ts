import type { Config, FileInfo, Group, Phone, RankEntry } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getConfig: () => request<Config>('/config'),

  saveConfig: (config: Config) =>
    request<{ ok: boolean }>('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),

  getFiles: (phone: Phone) =>
    request<{ files: FileInfo[] }>(`/files/${phone}`),

  refreshFiles: (phone: Phone) =>
    request<{ ok: boolean }>(`/files/${phone}/refresh`, { method: 'POST' }),

  getGroups: () => request<{ groups: Group[] }>('/groups'),

  createGroup: (name: string) =>
    request<{ group: Group }>('/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  updateGroup: (id: string, data: { name?: string; color?: string }) =>
    request<{ group: Group }>(`/groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    request<{ ok: boolean }>(`/groups/${id}`, { method: 'DELETE' }),

  addPhotos: (id: string, phone: Phone, filenames: string[]) =>
    request<{ group: Group }>(`/groups/${id}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, filenames }),
    }),

  removePhotos: (id: string, phone: Phone, filenames: string[]) =>
    request<{ group: Group }>(`/groups/${id}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, filenames }),
    }),

  setSelection: (id: string, phone: Phone, filename: string | null) =>
    request<{ group: Group }>(`/groups/${id}/selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, filename }),
    }),

  browseFolder: (prompt: string) =>
    request<{ path: string | null }>('/browse-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }),

  getRanking: () =>
    request<{ ranking: RankEntry[] }>('/ranking'),

  setRanking: (ranking: RankEntry[]) =>
    request<{ ok: boolean; ranking: RankEntry[] }>('/ranking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ranking }),
    }),

  thumbnailUrl: (phone: Phone, filename: string, size = 200) =>
    `${BASE}/thumbnail?phone=${phone}&filename=${encodeURIComponent(filename)}&size=${size}`,
};
