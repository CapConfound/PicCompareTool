import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Config, Group } from '../types';
import { SideBySide } from '../components/SideBySide';
import { ThemeToggle } from '../components/ThemeToggle';

const COLOR_DOT: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
};

export function ComparisonView() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getGroups(),
      api.getConfig().catch(() => null as Config | null),
    ])
      .then(([groupsData, configData]) => {
        setGroups(groupsData.groups);
        setConfig(configData);
        if (groupsData.groups.length > 0 && !selectedId) {
          setSelectedId(groupsData.groups[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleGroupUpdate(updated: Group) {
    setGroups(prev => prev.map(g => (g.id === updated.id ? updated : g)));
  }

  const selectedGroup = groups.find(g => g.id === selectedId) ?? null;
  const doneCount = groups.filter(
    g => g.selection.A !== null && g.selection.B !== null,
  ).length;
  const progressPct = groups.length > 0 ? (doneCount / groups.length) * 100 : 0;

  const nameA = config?.phoneAName?.trim() || 'Phone A';
  const nameB = config?.phoneBName?.trim() || 'Phone B';

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
          <button
            onClick={() => navigate('/group/A')}
            className="text-[var(--tx-lo)] hover:text-[var(--ac)] transition-colors font-mono"
          >
            grouping
          </button>
          <span className="text-[var(--tx-dim)]">/</span>
          <span className="text-[var(--tx-hi)] font-medium">compare</span>
          {!loading && (
            <span className="text-[var(--tx-lo)] ml-1.5 font-mono">
              {doneCount}/{groups.length} complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-px h-4 bg-[var(--border)]" />
          <button
            onClick={() => navigate('/rank')}
            className="flex items-center gap-1.5 bg-[var(--ok-10)] hover:bg-[var(--ok-15)] border border-[var(--ok-25)] hover:border-[var(--ok-40)] text-[var(--ok)] px-3 py-1 rounded-lg text-xs font-medium transition-all"
          >
            Rank →
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Group list sidebar */}
        <div className="w-60 bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col shrink-0">
          <div className="p-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] text-[var(--ac-txt)] uppercase tracking-widest font-medium">
                {groups.length} group{groups.length !== 1 ? 's' : ''}
              </p>
              {!loading && groups.length > 0 && (
                <span className="text-[10px] font-mono text-[var(--tx-lo)]">
                  {doneCount}/{groups.length}
                </span>
              )}
            </div>
            {/* Progress bar */}
            {!loading && groups.length > 0 && (
              <div className="w-full bg-[var(--bg-elevated)] rounded-full h-1 border border-[var(--border)]">
                <div
                  className="bg-[var(--ok)] h-1 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-px">
            {loading && (
              <div className="flex items-center gap-2 justify-center py-8 text-[var(--tx-lo)] text-xs">
                <span className="w-1 h-1 rounded-full bg-[var(--ac)] animate-pulse" />
                Loading…
              </div>
            )}
            {!loading && groups.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--tx-lo)] text-xs font-mono">// no groups yet</p>
                <button
                  onClick={() => navigate('/group/A')}
                  className="text-[var(--ac)] hover:opacity-80 text-xs mt-3 transition-opacity"
                >
                  Start grouping →
                </button>
              </div>
            )}

            {groups.map(group => {
              const dotClass = COLOR_DOT[group.color] ?? 'bg-slate-500';
              const hasA = group.selection.A !== null;
              const hasB = group.selection.B !== null;
              const done = hasA && hasB;
              const isSelected = selectedId === group.id;

              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedId(group.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-[var(--ac-10)] border border-[var(--ac-20)]'
                      : 'hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                  <span className="flex-1 text-xs text-[var(--tx-hi)] truncate">{group.name}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${hasA ? 'bg-[var(--ok)]' : 'bg-[var(--border)]'}`}
                      title={hasA ? 'Phone A picked' : 'Phone A not picked'}
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${hasB ? 'bg-[var(--ok)]' : 'bg-[var(--border)]'}`}
                      title={hasB ? 'Phone B picked' : 'Phone B not picked'}
                    />
                    {done && (
                      <span className="text-[var(--ok-txt)] text-[10px] ml-0.5">✓</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison panel */}
        <div className="flex-1 min-h-0 min-w-0">
          {selectedGroup ? (
            <SideBySide group={selectedGroup} onGroupUpdate={handleGroupUpdate} phoneAName={nameA} phoneBName={nameB} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-[var(--tx-lo)] text-sm font-mono">// select a group to compare</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
