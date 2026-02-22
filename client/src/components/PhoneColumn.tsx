import { useState } from 'react';
import { api } from '../api';
import type { Group, Phone } from '../types';

interface Props {
  phone: Phone;
  phoneName: string;
  group: Group;
  onGroupUpdate: (group: Group) => void;
}

export function PhoneColumn({ phone, phoneName, group, onGroupUpdate }: Props) {
  const photos = group.photos[phone];
  const selection = group.selection[phone];
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  async function handleSelect(filename: string) {
    const newSelection = selection === filename ? null : filename;
    const { group: updated } = await api.setSelection(group.id, phone, newSelection);
    onGroupUpdate(updated);
  }

  function handleLoad(filename: string) {
    setLoadingStates(prev => ({ ...prev, [filename]: true }));
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Column header */}
      <div className="px-3 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--bg-panel)]">
        <div className="flex items-center justify-between">
          <p className="text-[var(--tx-md)] text-xs font-medium">{phoneName}</p>
          {selection && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--ok)] font-mono">
              <span className="w-1 h-1 rounded-full bg-[var(--ok)]" />
              best
            </span>
          )}
        </div>
        {selection ? (
          <p className="text-[var(--ok-txt)] text-[10px] font-mono truncate mt-0.5" title={selection}>
            {selection.split('/').pop()}
          </p>
        ) : (
          <p className="text-[var(--tx-lo)] text-[10px] font-mono mt-0.5">// click to mark best</p>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--tx-lo)] text-sm font-mono">// no photos in group</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {photos.map(filename => {
            const isSelected = selection === filename;
            const isLoaded = !!loadingStates[filename];

            return (
              <div
                key={filename}
                className={`relative cursor-pointer rounded-lg overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-[var(--ok-40)] shadow-lg shadow-[var(--ok-shadow)] ring-1 ring-[var(--ok-20)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hi)]'
                }`}
                onClick={() => handleSelect(filename)}
              >
                {/* Skeleton */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-[var(--bg-elevated)] animate-pulse min-h-32" />
                )}

                <img
                  src={api.thumbnailUrl(phone, filename, 1920)}
                  loading="lazy"
                  decoding="async"
                  className={`w-full h-auto block transition-opacity duration-200 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  alt={filename}
                  onLoad={() => handleLoad(filename)}
                />

                {/* Best pick badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[var(--ok)] text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium shadow-md">
                    best pick
                  </div>
                )}

                {/* Filename bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 pointer-events-none">
                  <p className="text-slate-300 text-[10px] font-mono truncate">
                    {filename.split('/').pop()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
