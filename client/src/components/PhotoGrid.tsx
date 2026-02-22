import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FileInfo, Group, Phone } from '../types';
import { PhotoThumbnail } from './PhotoThumbnail';

const CELL_SIZE = 200;
const GAP = 1; // 1px black separator between photos

interface Props {
  phone: Phone;
  files: FileInfo[];
  groups: Group[];
  loading?: boolean;
}

export function PhotoGrid({ phone, files, groups, loading = false }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Track container width for responsive column count
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);

    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = Math.max(1, Math.floor(containerWidth / CELL_SIZE));
  const gridWidth = columns * CELL_SIZE + (columns - 1) * GAP;

  // Build map: filename → group color+name for overlay
  const photoGroupMap = useMemo(() => {
    const map = new Map<string, { color: string; name: string }>();
    for (const group of groups) {
      for (const filename of group.photos[phone]) {
        map.set(filename, { color: group.color, name: group.name });
      }
    }
    return map;
  }, [groups, phone]);

  const filenames = useMemo(() => files.map(f => f.filename), [files]);
  const rows = Math.ceil(files.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CELL_SIZE + GAP,
    overscan: 3,
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]">
        <div className="flex items-center gap-2 text-[var(--tx-lo)] text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ac)] animate-pulse" />
          <span className="font-mono">Loading…</span>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[var(--tx-lo)] text-sm font-mono">// no photos found in this folder</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${gridWidth}px`,
          position: 'relative',
          margin: '0 auto',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const rowFiles = files.slice(
            virtualRow.index * columns,
            (virtualRow.index + 1) * columns,
          );

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${gridWidth}px`,
                height: `${CELL_SIZE}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                gap: `${GAP}px`,
              }}
            >
              {rowFiles.map((file, colIdx) => {
                const globalIndex = virtualRow.index * columns + colIdx;
                const groupInfo = photoGroupMap.get(file.filename);
                return (
                  <PhotoThumbnail
                    key={file.filename}
                    phone={phone}
                    filename={file.filename}
                    index={globalIndex}
                    files={filenames}
                    groupColor={groupInfo?.color}
                    groupName={groupInfo?.name}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
