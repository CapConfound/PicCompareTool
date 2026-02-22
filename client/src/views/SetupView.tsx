import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ThemeToggle } from '../components/ThemeToggle';

function FolderPicker({
  label,
  value,
  onChange,
  browsePrompt,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
  browsePrompt: string;
}) {
  const [browsing, setBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState('');

  async function handleBrowse() {
    setBrowsing(true);
    setBrowseError('');
    try {
      const { path } = await api.browseFolder(browsePrompt);
      if (path) onChange(path);
    } catch (err) {
      setBrowseError((err as Error).message);
    } finally {
      setBrowsing(false);
    }
  }

  return (
    <div>
      <label className="block text-[10px] font-medium text-[var(--ac-txt)] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={handleBrowse}
        disabled={browsing}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all disabled:opacity-50 ${
          value
            ? 'bg-[var(--bg-elevated)] border-[var(--border-hi)] hover:border-[var(--ac-50)]'
            : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:border-[var(--border-hi)]'
        }`}
      >
        <svg
          className="w-4 h-4 text-[var(--ac-txt)] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v8.25m19.5 0A2.25 2.25 0 0119.5 18H4.5a2.25 2.25 0 01-2.25-2.25V6"
          />
        </svg>
        {value ? (
          <span className="text-[var(--tx-hi)] text-sm font-mono truncate flex-1">{value}</span>
        ) : (
          <span className="text-[var(--tx-lo)] text-sm flex-1">
            {browsing ? 'Opening picker…' : 'Click to select folder…'}
          </span>
        )}
        {value && (
          <span className="text-[var(--ac-txt)] text-xs shrink-0 hover:text-[var(--ac)] transition-colors">
            {browsing ? '…' : 'change'}
          </span>
        )}
      </button>
      {browseError && (
        <p className="text-[var(--er)] text-xs mt-1.5 font-mono bg-[var(--er-bg)] px-2 py-1 rounded border border-[var(--er-bd)]">
          {browseError}
        </p>
      )}
    </div>
  );
}

export function SetupView() {
  const navigate = useNavigate();
  const [phoneA, setPhoneA] = useState('');
  const [phoneB, setPhoneB] = useState('');
  const [phoneAName, setPhoneAName] = useState('');
  const [phoneBName, setPhoneBName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    api
      .getConfig()
      .then(config => {
        setPhoneA(config.phoneA);
        setPhoneB(config.phoneB);
        setPhoneAName(config.phoneAName ?? '');
        setPhoneBName(config.phoneBName ?? '');
        setHasExisting(true);
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneA || !phoneB) return;
    setSaving(true);
    setError('');
    try {
      await api.saveConfig({ phoneA, phoneB, phoneAName: phoneAName || undefined, phoneBName: phoneBName || undefined });
      navigate('/group/A');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] dot-grid flex items-center justify-center p-8">
      {/* Theme toggle — fixed top right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--ac-15)] border border-[var(--ac-25)] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--ac)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[var(--tx-hi)] tracking-tight">PicCompareTool</h1>
          </div>
          <p className="text-[var(--tx-lo)] text-sm pl-12">Side-by-side photo comparison · local only</p>
        </div>

        {/* Config card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 mb-3">
          <p className="text-[10px] text-[var(--ac-txt)] uppercase tracking-widest mb-4 font-medium">
            Source Folders
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <FolderPicker
                label="Device A — folder"
                value={phoneA}
                onChange={setPhoneA}
                browsePrompt="Select Phone A photo folder"
              />
              <input
                type="text"
                value={phoneAName}
                onChange={e => setPhoneAName(e.target.value)}
                placeholder="Label, e.g. Galaxy S25  (optional)"
                className="w-full bg-[var(--bg-elevated)] text-[var(--tx-md)] text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--ac-40)] focus:text-[var(--tx-hi)] placeholder-[var(--tx-lo)] font-mono transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <FolderPicker
                label="Device B — folder"
                value={phoneB}
                onChange={setPhoneB}
                browsePrompt="Select Phone B photo folder"
              />
              <input
                type="text"
                value={phoneBName}
                onChange={e => setPhoneBName(e.target.value)}
                placeholder="Label, e.g. Pixel 6  (optional)"
                className="w-full bg-[var(--bg-elevated)] text-[var(--tx-md)] text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--ac-40)] focus:text-[var(--tx-hi)] placeholder-[var(--tx-lo)] font-mono transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[var(--er-bg)] border border-[var(--er-bd)] rounded-lg px-3 py-2">
                <p className="text-[var(--er)] text-xs font-mono">{error}</p>
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={saving || !phoneA || !phoneB}
                className="w-full bg-[var(--ac)] hover:opacity-90 disabled:opacity-25 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-[var(--ac-shadow)] tracking-wide"
              >
                {saving ? 'Saving…' : hasExisting ? 'Update & Start' : 'Start →'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick nav */}
        {hasExisting && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 mb-6">
            <p className="text-[10px] text-[var(--tx-lo)] uppercase tracking-widest mb-2 px-1">Quick nav</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => navigate('/group/A')}
                className="flex-1 text-xs text-[var(--tx-md)] hover:text-[var(--ac)] hover:bg-[var(--ac-08)] border border-[var(--border)] hover:border-[var(--ac-25)] rounded-lg px-3 py-1.5 transition-all"
              >
                Group A
              </button>
              <button
                onClick={() => navigate('/group/B')}
                className="flex-1 text-xs text-[var(--tx-md)] hover:text-[var(--ac)] hover:bg-[var(--ac-08)] border border-[var(--border)] hover:border-[var(--ac-25)] rounded-lg px-3 py-1.5 transition-all"
              >
                Group B
              </button>
              <button
                onClick={() => navigate('/compare')}
                className="flex-1 text-xs text-[var(--tx-md)] hover:text-[var(--ok)] hover:bg-[var(--ok-10)] border border-[var(--border)] hover:border-[var(--ok-25)] rounded-lg px-3 py-1.5 transition-all"
              >
                Compare
              </button>
            </div>
          </div>
        )}

        {/* Workflow */}
        <div className="px-1">
          <p className="text-[10px] text-[var(--tx-lo)] uppercase tracking-widest font-medium mb-3">Workflow</p>
          <ol className="space-y-2">
            {[
              'Select source folders above',
              'Group Phone A photos by subject',
              'Assign Phone B photos to groups',
              'Pick the best shot from each phone',
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-2.5 text-xs text-[var(--tx-lo)]">
                <span className="text-[var(--ac)] font-mono text-[10px] w-3 shrink-0">{i + 1}</span>
                <span className="w-px h-3 bg-[var(--border)] shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[var(--tx-dim)] text-[10px] font-mono">
            // photos are never uploaded — read directly from disk
          </p>
        </div>

      </div>
    </div>
  );
}
