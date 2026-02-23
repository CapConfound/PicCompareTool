import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Config, FileInfo, Group, Phone } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';
import { GroupPanel } from '../components/GroupPanel';
import { ThemeToggle } from '../components/ThemeToggle';
import { useUIStore } from '../store';

function SidebarToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={open ? 'Hide sidebar' : 'Show sidebar'}
      className="w-6 h-6 flex items-center justify-center text-[var(--tx-lo)] hover:text-[var(--ac)] hover:bg-[var(--ac-08)] rounded transition-all"
    >
      {open ? '‹' : '›'}
    </button>
  );
}

export function GroupingView() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const phoneKey = (phone?.toUpperCase() === 'B' ? 'B' : 'A') as Phone;

  // Files tracked per-phone so both grids can stay mounted and each preserve its scroll position
  const [filesA, setFilesA] = useState<FileInfo[]>([]);
  const [filesB, setFilesB] = useState<FileInfo[]>([]);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingB, setLoadingB] = useState(true);

  const [groups, setGroups] = useState<Group[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { clearSelection } = useUIStore();

  // Load config + groups ONCE on mount
  useEffect(() => {
    Promise.all([
      api.getConfig().catch(() => null as Config | null),
      api.getGroups(),
    ])
      .then(([configData, groupsData]) => {
        setConfig(configData);
        setGroups(groupsData.groups);
        setGroupsLoaded(true);
      })
      .catch(err => setError((err as Error).message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load files for both phones on mount in parallel
  useEffect(() => {
    api.getFiles('A')
      .then(data => setFilesA(data.files))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoadingA(false));

    api.getFiles('B')
      .then(data => setFilesB(data.files))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoadingB(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear selection when switching phones
  useEffect(() => {
    clearSelection();
  }, [phoneKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGroupsChange = useCallback((updated: Group[]) => {
    setGroups(updated);
  }, []);

  const activeFiles = phoneKey === 'A' ? filesA : filesB;
  const assignedCount = groups.reduce(
    (sum, g) => sum + g.photos[phoneKey].length,
    0,
  );

  const nameA = config?.phoneAName?.trim() || 'Phone A';
  const nameB = config?.phoneBName?.trim() || 'Phone B';
  const activeName = phoneKey === 'A' ? nameA : nameB;

  if (!groupsLoaded) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--tx-lo)] text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ac)] animate-pulse" />
          Scanning photos…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--er)] text-sm font-mono bg-[var(--er-bg)] border border-[var(--er-bd)] px-4 py-2 rounded-lg">{error}</p>
        <button
          onClick={() => navigate('/setup')}
          className="text-[var(--ac)] hover:opacity-80 text-sm transition-opacity"
        >
          ← Go to Setup
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Header */}
      <div className="app-header flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => navigate('/setup')}
            className="text-[var(--tx-lo)] hover:text-[var(--ac)] transition-colors font-mono"
          >
            setup
          </button>
          <span className="text-[var(--tx-dim)]">/</span>
          <span className="text-[var(--tx-hi)] font-medium">{activeName}</span>
          <span className="text-[var(--tx-lo)] ml-1.5 font-mono">
            {activeFiles.length} photos · {assignedCount} grouped
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SidebarToggle open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
          <div className="w-px h-4 bg-[var(--border)]" />
          <ThemeToggle />

          <div className="w-px h-4 bg-[var(--border)]" />

          <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => { clearSelection(); navigate('/group/A'); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                phoneKey === 'A'
                  ? 'bg-[var(--ac-20)] text-[var(--ac)] border border-[var(--ac-30)]'
                  : 'text-[var(--tx-lo)] hover:text-[var(--tx-hi)]'
              }`}
            >
              {nameA}
            </button>
            <button
              onClick={() => { clearSelection(); navigate('/group/B'); }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                phoneKey === 'B'
                  ? 'bg-[var(--ac-20)] text-[var(--ac)] border border-[var(--ac-30)]'
                  : 'text-[var(--tx-lo)] hover:text-[var(--tx-hi)]'
              }`}
            >
              {nameB}
            </button>
          </div>

          <div className="w-px h-4 bg-[var(--border)]" />

          <button
            onClick={() => { clearSelection(); navigate('/compare'); }}
            className="flex items-center gap-1.5 bg-[var(--ok-10)] hover:bg-[var(--ok-15)] border border-[var(--ok-25)] hover:border-[var(--ok-40)] text-[var(--ok)] px-3 py-1 rounded-lg text-xs font-medium transition-all"
          >
            Compare →
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <GroupPanel
            phone={phoneKey}
            phoneName={activeName}
            groups={groups}
            onGroupsChange={handleGroupsChange}
          />
        )}

        {/* Both grids stay mounted so each phone keeps its own scroll position */}
        <div className="flex-1 relative min-h-0">
          <div className={`absolute inset-0 flex ${phoneKey === 'A' ? '' : 'invisible pointer-events-none'}`}>
            <PhotoGrid phone="A" files={filesA} groups={groups} loading={loadingA} />
          </div>
          <div className={`absolute inset-0 flex ${phoneKey === 'B' ? '' : 'invisible pointer-events-none'}`}>
            <PhotoGrid phone="B" files={filesB} groups={groups} loading={loadingB} />
          </div>
        </div>
      </div>
    </div>
  );
}
