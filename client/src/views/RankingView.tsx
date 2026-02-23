import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Config, Group, RankEntry } from '../types';
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

export function RankingView() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<Config | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [votes, setVotes] = useState<Map<string, 'A' | 'B'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      api.getGroups(),
      api.getRanking(),
      api.getConfig().catch(() => null as Config | null),
    ])
      .then(([groupsData, rankingData, configData]) => {
        setGroups(groupsData.groups);
        setConfig(configData);
        const v = new Map<string, 'A' | 'B'>();
        for (const entry of rankingData.ranking) {
          v.set(entry.groupId, entry.winner);
        }
        setVotes(v);
        const votablePairs = groupsData.groups.filter(g => g.selection.A && g.selection.B);
        if (votablePairs.length > 0 && votablePairs.every(g => v.has(g.id))) {
          setShowResults(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Derived values (safe to compute even while loading)
  const pairs = groups.filter(g => g.selection.A && g.selection.B);
  const safeIdx = Math.max(0, Math.min(currentIdx, Math.max(0, pairs.length - 1)));
  const currentGroup = pairs[safeIdx] ?? null;
  const nameA = config?.phoneAName?.trim() || 'Phone A';
  const nameB = config?.phoneBName?.trim() || 'Phone B';
  const aWins = pairs.filter(g => votes.get(g.id) === 'A').length;
  const bWins = pairs.filter(g => votes.get(g.id) === 'B').length;
  const votedCount = pairs.filter(g => votes.has(g.id)).length;
  const overallWinner = aWins > bWins ? 'A' : bWins > aWins ? 'B' : null;

  async function persistVotes(v: Map<string, 'A' | 'B'>) {
    setSaving(true);
    try {
      const entries: RankEntry[] = Array.from(v.entries()).map(([groupId, winner]) => ({
        groupId,
        winner,
      }));
      await api.setRanking(entries);
    } catch {
      // silent — don't block the UI
    } finally {
      setSaving(false);
    }
  }

  function handleVote(winner: 'A' | 'B') {
    if (!currentGroup) return;
    const next = new Map(votes);
    next.set(currentGroup.id, winner);
    setVotes(next);
    void persistVotes(next);
    if (safeIdx >= pairs.length - 1) {
      setShowResults(true);
    } else {
      setCurrentIdx(safeIdx + 1);
    }
  }

  // ── Shared header ────────────────────────────────────────────────────────
  const headerEl = (
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
        <button
          onClick={() => navigate('/compare')}
          className="text-[var(--tx-lo)] hover:text-[var(--ac)] transition-colors font-mono"
        >
          compare
        </button>
        <span className="text-[var(--tx-dim)]">/</span>
        <span className="text-[var(--tx-hi)] font-medium">rank</span>
        {!loading && (
          <span className="text-[var(--tx-lo)] ml-1.5 font-mono">
            {showResults ? 'results' : `${votedCount} / ${pairs.length}`}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {saving && (
          <span className="text-[var(--tx-lo)] text-[10px] font-mono animate-pulse">saving</span>
        )}
        <ThemeToggle />
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--tx-lo)] text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ac)] animate-pulse" />
          Loading…
        </div>
      </div>
    );
  }

  // ── No pairs yet ──────────────────────────────────────────────────────────
  if (pairs.length === 0) {
    return (
      <div className="h-screen bg-[var(--bg-base)] flex flex-col">
        {headerEl}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--tx-lo)] text-sm font-mono mb-2">// no pairs to compare yet</p>
            <p className="text-[var(--tx-dim)] text-xs mb-5">
              Pick the best photo per group in the comparison view first
            </p>
            <button
              onClick={() => navigate('/compare')}
              className="text-[var(--ac)] hover:opacity-80 text-xs transition-opacity"
            >
              ← Go to compare
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results view ──────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="h-screen bg-[var(--bg-base)] flex flex-col">
        {headerEl}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-4 py-6">

            {/* Overall winner banner */}
            <div
              className={`text-center mb-5 px-4 py-3 rounded-xl border ${
                overallWinner
                  ? 'bg-[var(--ok-10)] border-[var(--ok-25)]'
                  : 'bg-[var(--ac-08)] border-[var(--ac-20)]'
              }`}
            >
              {overallWinner ? (
                <>
                  <p className="text-[var(--ok)] font-medium">
                    🏆 {overallWinner === 'A' ? nameA : nameB} wins
                  </p>
                  <p className="text-[var(--tx-lo)] text-xs font-mono mt-0.5">
                    {nameA} {aWins} — {bWins} {nameB}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[var(--ac)] font-medium">It&apos;s a tie!</p>
                  <p className="text-[var(--tx-lo)] text-xs font-mono mt-0.5">
                    {nameA} {aWins} — {bWins} {nameB}
                  </p>
                </>
              )}
            </div>

            {/* Phone score cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['A', 'B'] as const).map(phone => {
                const wins = phone === 'A' ? aWins : bWins;
                const isWinner = overallWinner === phone;
                const isLoser = overallWinner !== null && overallWinner !== phone;
                return (
                  <div
                    key={phone}
                    className={`text-center px-3 py-2.5 rounded-lg border transition-all ${
                      isWinner
                        ? 'border-[var(--ok-40)] bg-[var(--ok-10)]'
                        : isLoser
                        ? 'border-[var(--border)] opacity-50'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        isWinner ? 'text-[var(--ok)]' : 'text-[var(--tx-hi)]'
                      }`}
                    >
                      {phone === 'A' ? nameA : nameB}
                    </p>
                    <p className="text-2xl font-mono text-[var(--tx-hi)] mt-0.5">{wins}</p>
                    {isWinner && (
                      <p className="text-[10px] text-[var(--ok)] font-mono tracking-widest mt-0.5">
                        WINNER
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Per-group pair results */}
            <div className="space-y-2">
              {pairs.map(group => {
                const vote = votes.get(group.id);
                const dotClass = COLOR_DOT[group.color] ?? 'bg-slate-500';
                return (
                  <div
                    key={group.id}
                    className="rounded-xl border border-[var(--border)] overflow-hidden"
                  >
                    {/* Group header row */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border)]">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                      <span className="text-xs text-[var(--tx-lo)] font-mono flex-1 truncate">
                        {group.name}
                      </span>
                      {!vote && (
                        <span className="text-[var(--tx-dim)] text-[10px] font-mono">
                          not voted
                        </span>
                      )}
                    </div>

                    {/* Photos — gap-px shows the --border color between them */}
                    <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
                      {(['A', 'B'] as const).map(phone => {
                        const filename =
                          phone === 'A' ? group.selection.A! : group.selection.B!;
                        const isWinner = vote === phone;
                        const isLoser = !!vote && vote !== phone;
                        return (
                          <div
                            key={phone}
                            className={`relative aspect-square overflow-hidden transition-opacity ${
                              isLoser ? 'opacity-30' : ''
                            }`}
                          >
                            <img
                              src={api.thumbnailUrl(phone, filename, 200)}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />

                            {/* Winner green overlay + border */}
                            {isWinner && (
                              <>
                                <div className="absolute inset-0 bg-[var(--ok-10)] pointer-events-none" />
                                <div className="absolute inset-0 border-[3px] border-[var(--ok)] pointer-events-none" />
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--ok)] flex items-center justify-center pointer-events-none">
                                  <span className="text-white text-[10px] font-mono leading-none">
                                    ✓
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Phone name label */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent px-2 py-1.5 pointer-events-none">
                              <span className="text-white text-[10px] font-medium">
                                {phone === 'A' ? nameA : nameB}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentIdx(0);
                }}
                className="text-xs text-[var(--tx-lo)] hover:text-[var(--ac)] transition-colors font-mono"
              >
                ← vote again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Voting view ───────────────────────────────────────────────────────────
  const currentVote = currentGroup ? votes.get(currentGroup.id) : undefined;
  const currentDotClass = currentGroup ? (COLOR_DOT[currentGroup.color] ?? 'bg-slate-500') : '';

  return (
    <div className="h-screen bg-[var(--bg-base)] flex flex-col overflow-hidden">
      {headerEl}

      {/* Group label */}
      <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-panel)]">
        <div className={`w-2 h-2 rounded-full shrink-0 ${currentDotClass}`} />
        <span className="text-sm text-[var(--tx-hi)] font-medium">{currentGroup?.name}</span>
        <span className="text-xs text-[var(--tx-dim)] font-mono">· click the better photo</span>
      </div>

      {/* Photo pair */}
      <div className="flex-1 min-h-0 flex gap-1 p-1">
        {(['A', 'B'] as const).map(phone => {
          const filename =
            phone === 'A' ? currentGroup!.selection.A! : currentGroup!.selection.B!;
          const isChosen = currentVote === phone;
          const isRejected = !!currentVote && currentVote !== phone;
          return (
            <button
              key={phone}
              onClick={() => handleVote(phone)}
              className={`flex-1 relative overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
                isChosen
                  ? 'border-[var(--ok)] shadow-[0_0_0_1px_var(--ok-40)]'
                  : isRejected
                  ? 'border-transparent opacity-40'
                  : 'border-transparent hover:border-[var(--ac-40)]'
              }`}
            >
              <img
                src={api.thumbnailUrl(phone, filename, 1920)}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ background: 'var(--bg-elevated)' }}
                draggable={false}
              />

              {/* Phone label */}
              <div
                className={`absolute ${phone === 'A' ? 'top-2 left-2' : 'top-2 right-2'} bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs font-medium pointer-events-none`}
              >
                {phone === 'A' ? nameA : nameB}
              </div>

              {/* Picked badge */}
              {isChosen && (
                <div
                  className={`absolute ${phone === 'A' ? 'top-2 right-2' : 'top-2 left-2'} bg-[var(--ok)] px-2 py-0.5 rounded-md text-white text-xs font-mono pointer-events-none`}
                >
                  ✓ picked
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer — prev / dot indicator / results */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-panel)]">
        <button
          onClick={() => setCurrentIdx(Math.max(0, safeIdx - 1))}
          disabled={safeIdx === 0}
          className="text-xs text-[var(--tx-lo)] hover:text-[var(--tx-hi)] disabled:opacity-30 font-mono transition-colors"
        >
          ← prev
        </button>

        {/* Dot progress indicators */}
        {pairs.length <= 20 ? (
          <div className="flex gap-1.5 items-center">
            {pairs.map((g, i) => {
              const voted = votes.has(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => setCurrentIdx(i)}
                  title={g.name}
                  className={`rounded-full transition-all duration-200 ${
                    i === safeIdx
                      ? 'w-3 h-2 bg-[var(--ac)]'
                      : voted
                      ? 'w-2 h-2 bg-[var(--ok-40)] hover:bg-[var(--ok)]'
                      : 'w-2 h-2 bg-[var(--border)] hover:bg-[var(--border-hi)]'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-[var(--tx-lo)] font-mono">
            {safeIdx + 1} / {pairs.length}
          </span>
        )}

        <button
          onClick={() => setShowResults(true)}
          className="text-xs text-[var(--tx-lo)] hover:text-[var(--ac)] font-mono transition-colors"
        >
          {votedCount === pairs.length
            ? 'results →'
            : `skip (${votedCount}/${pairs.length}) →`}
        </button>
      </div>
    </div>
  );
}
