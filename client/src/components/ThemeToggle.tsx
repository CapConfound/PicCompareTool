import { useUIStore } from '../store';

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className="flex bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => theme !== 'light' && toggleTheme()}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          theme === 'light'
            ? 'bg-[var(--ac-20)] text-[var(--ac)] border border-[var(--ac-30)]'
            : 'text-[var(--tx-lo)] hover:text-[var(--tx-md)]'
        }`}
        title="Light theme"
      >
        ☀
      </button>
      <button
        onClick={() => theme !== 'dark' && toggleTheme()}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          theme === 'dark'
            ? 'bg-[var(--ac-20)] text-[var(--ac)] border border-[var(--ac-30)]'
            : 'text-[var(--tx-lo)] hover:text-[var(--tx-md)]'
        }`}
        title="Dark theme"
      >
        ☾
      </button>
    </div>
  );
}
