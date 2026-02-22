import { create } from 'zustand';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
  return saved === 'light' ? 'light' : 'dark';
}

const initialTheme = getInitialTheme();
// Apply immediately to avoid flash — before React even mounts
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme);
}

interface UIStore {
  pendingSelection: Set<string>;
  lastClickedIndex: number | null;
  activeGroupId: string | null;
  theme: Theme;

  togglePhoto: (filename: string, index: number, shiftKey: boolean, files: string[]) => void;
  clearSelection: () => void;
  setActiveGroup: (id: string | null) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  pendingSelection: new Set(),
  lastClickedIndex: null,
  activeGroupId: null,
  theme: initialTheme,

  togglePhoto: (filename, index, shiftKey, files) => {
    const { pendingSelection, lastClickedIndex } = get();
    const next = new Set(pendingSelection);

    if (shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      for (let i = start; i <= end; i++) {
        next.add(files[i]);
      }
    } else {
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
    }

    set({ pendingSelection: next, lastClickedIndex: index });
  },

  clearSelection: () => set({ pendingSelection: new Set(), lastClickedIndex: null }),

  setActiveGroup: (id) => set({ activeGroupId: id }),

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },
}));
