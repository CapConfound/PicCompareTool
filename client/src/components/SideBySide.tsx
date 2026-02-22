import type { Group } from '../types';
import { PhoneColumn } from './PhoneColumn';

interface Props {
  group: Group;
  onGroupUpdate: (group: Group) => void;
  phoneAName?: string;
  phoneBName?: string;
}

export function SideBySide({ group, onGroupUpdate, phoneAName = 'Phone A', phoneBName = 'Phone B' }: Props) {
  const totalA = group.photos.A.length;
  const totalB = group.photos.B.length;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-[var(--border)] shrink-0 bg-[var(--bg-panel)] flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[var(--ac)] shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-[var(--tx-hi)] font-medium text-sm truncate">{group.name}</h2>
          <p className="text-[var(--tx-lo)] text-[10px] font-mono mt-0.5">
            {phoneAName}: {totalA} photo{totalA !== 1 ? 's' : ''} · {phoneBName}: {totalB} photo{totalB !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 divide-x divide-[var(--border)]">
        <PhoneColumn phone="A" phoneName={phoneAName} group={group} onGroupUpdate={onGroupUpdate} />
        <PhoneColumn phone="B" phoneName={phoneBName} group={group} onGroupUpdate={onGroupUpdate} />
      </div>
    </div>
  );
}
