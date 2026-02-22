import { useState } from 'react';
import { api } from '../api';
import type { Phone } from '../types';
import { useUIStore } from '../store';

const COLOR_BORDER: Record<string, string> = {
  blue: 'border-blue-500',
  green: 'border-green-500',
  rose: 'border-rose-500',
  amber: 'border-amber-500',
  violet: 'border-violet-500',
  teal: 'border-teal-500',
  orange: 'border-orange-500',
  pink: 'border-pink-500',
  cyan: 'border-cyan-500',
  lime: 'border-lime-500',
};

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

interface Props {
  phone: Phone;
  filename: string;
  index: number;
  files: string[];
  groupColor?: string;
  groupName?: string;
}

export function PhotoThumbnail({ phone, filename, index, files, groupColor, groupName }: Props) {
  const { pendingSelection, togglePhoto } = useUIStore();
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSelected = pendingSelection.has(filename);
  const borderClass = groupColor ? (COLOR_BORDER[groupColor] ?? 'border-slate-500') : '';
  const dotClass = groupColor ? (COLOR_DOT[groupColor] ?? '') : '';

  function handleClick(e: React.MouseEvent) {
    togglePhoto(filename, index, e.shiftKey, files);
  }

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden shrink-0 transition-opacity ${
        groupColor && !isSelected ? 'opacity-90 hover:opacity-100' : ''
      }`}
      style={{ width: 200, height: 200 }}
      onClick={handleClick}
      title={filename}
    >
      {/* Skeleton while loading */}
      {!loaded && !imgError && (
        <div className="absolute inset-0 bg-[var(--bg-elevated)] animate-pulse" />
      )}

      {/* Error state */}
      {imgError && (
        <div className="absolute inset-0 bg-[var(--bg-elevated)] flex items-center justify-center">
          <span className="text-[var(--tx-lo)] text-xs font-mono">err</span>
        </div>
      )}

      <img
        src={api.thumbnailUrl(phone, filename, 200)}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        alt={filename}
        onLoad={() => setLoaded(true)}
        onError={() => setImgError(true)}
      />

      {/* Selection tint */}
      {isSelected && (
        <div className="absolute inset-0 bg-[var(--ac-15)] pointer-events-none" />
      )}

      {/* Border overlay — child div renders above <img>, clipped inside by parent overflow:hidden */}
      <div
        className={`absolute inset-0 pointer-events-none border-2 transition-colors ${
          isSelected
            ? 'border-[var(--ac)]'
            : groupColor
            ? borderClass
            : 'border-transparent group-hover:border-[var(--border-hi)]'
        }`}
      />

      {/* Group color dot */}
      {groupColor && (
        <div
          className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${dotClass} shadow ring-1 ring-black/50`}
          title={groupName}
        />
      )}

      {/* Filename on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-slate-300 text-[10px] font-mono truncate">{filename.split('/').pop()}</p>
      </div>
    </div>
  );
}
