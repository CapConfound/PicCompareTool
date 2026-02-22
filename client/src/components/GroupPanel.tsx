import { useState } from 'react';
import { api } from '../api';
import type { Group, Phone } from '../types';
import { useUIStore } from '../store';

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
  phoneName: string;
  groups: Group[];
  onGroupsChange: (groups: Group[]) => void;
}

export function GroupPanel({ phone, phoneName, groups, onGroupsChange }: Props) {
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const { pendingSelection, activeGroupId, setActiveGroup, clearSelection } = useUIStore();

  const selectionCount = pendingSelection.size;

  const selectedFilenames = Array.from(pendingSelection);
  const selectedInGroup = activeGroupId
    ? groups
        .find(g => g.id === activeGroupId)
        ?.photos[phone].filter(f => pendingSelection.has(f)) ?? []
    : [];

  async function handleCreateAndAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const { group: newGroup } = await api.createGroup(newGroupName.trim());
      let updatedGroup = newGroup;

      if (selectionCount > 0) {
        const { group } = await api.addPhotos(newGroup.id, phone, selectedFilenames);
        updatedGroup = group;
        clearSelection();
      }

      onGroupsChange(
        [...groups.map(g => (g.id === updatedGroup.id ? updatedGroup : g)), updatedGroup].filter(
          (g, i, arr) => arr.findIndex(x => x.id === g.id) === i,
        ),
      );
      setNewGroupName('');
      setActiveGroup(updatedGroup.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddToGroup(groupId: string) {
    if (selectionCount === 0) return;
    const { group } = await api.addPhotos(groupId, phone, selectedFilenames);
    onGroupsChange(groups.map(g => (g.id === group.id ? group : g)));
    clearSelection();
  }

  async function handleRemoveFromGroup(groupId: string) {
    if (selectedInGroup.length === 0) return;
    const { group } = await api.removePhotos(groupId, phone, selectedInGroup);
    onGroupsChange(groups.map(g => (g.id === group.id ? group : g)));
    clearSelection();
  }

  async function handleDeleteGroup(groupId: string) {
    await api.deleteGroup(groupId);
    onGroupsChange(groups.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) setActiveGroup(null);
  }

  return (
    <div className="w-72 bg-[var(--bg-panel)] border-r border-[var(--border)] flex flex-col shrink-0">

      {/* New group form */}
      <div className="p-3 border-b border-[var(--border)]">
        <p className="text-[10px] text-[var(--ac-txt)] uppercase tracking-widest mb-2 font-medium">Groups</p>
        <form onSubmit={handleCreateAndAssign} className="flex gap-1.5">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder={selectionCount > 0 ? 'Name + add selection…' : 'New group name…'}
            className="flex-1 bg-[var(--bg-elevated)] text-[var(--tx-hi)] text-sm px-2.5 py-1.5 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--ac-50)] placeholder-[var(--tx-lo)] transition-colors"
          />
          <button
            type="submit"
            disabled={creating || !newGroupName.trim()}
            className="bg-[var(--ac-15)] hover:bg-[var(--ac-25)] disabled:opacity-30 border border-[var(--ac-25)] hover:border-[var(--ac-50)] text-[var(--ac)] text-sm px-3 py-1.5 rounded-lg shrink-0 transition-all font-medium"
            title="Create group"
          >
            +
          </button>
        </form>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-px">
        {groups.length === 0 && (
          <p className="text-[var(--tx-lo)] text-xs text-center py-6 font-mono">// no groups yet</p>
        )}

        {groups.map(group => {
          const count = group.photos[phone].length;
          const isActive = activeGroupId === group.id;
          const dotClass = COLOR_DOT[group.color] ?? 'bg-slate-500';

          return (
            <div
              key={group.id}
              className={`group/item flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-[var(--ac-10)] border border-[var(--ac-20)]'
                  : 'hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border)]'
              }`}
              onClick={() => setActiveGroup(isActive ? null : group.id)}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
              <span className="flex-1 text-sm text-[var(--tx-hi)] truncate">{group.name}</span>

              {/* Add selection to this group */}
              {selectionCount > 0 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleAddToGroup(group.id);
                  }}
                  className="text-[10px] text-[var(--ac)] hover:opacity-80 shrink-0 font-medium"
                  title={`Add ${selectionCount} photos to "${group.name}"`}
                >
                  +
                </button>
              )}

              <span
                className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded transition-colors ${
                  count > 0
                    ? 'text-[var(--ac-txt)] bg-[var(--ac-10)]'
                    : 'text-[var(--tx-lo)] bg-[var(--bg-elevated)]'
                }`}
              >
                {count}
              </span>

              {/* Delete group */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteGroup(group.id);
                }}
                className="text-xs text-[var(--tx-dim)] hover:text-[var(--er)] shrink-0 opacity-0 group-hover/item:opacity-100 transition-all"
                title="Delete group"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Selection action bar */}
      {selectionCount > 0 && (
        <div className="px-3 py-2.5 border-t border-[var(--border)] bg-[var(--ac-05)]">
          <p className="text-[var(--ac)] text-xs font-mono mb-1.5">
            {selectionCount} photo{selectionCount > 1 ? 's' : ''} selected
          </p>
          {activeGroupId && selectedInGroup.length > 0 && (
            <button
              onClick={() => handleRemoveFromGroup(activeGroupId)}
              className="w-full text-left text-xs text-[var(--er)] hover:opacity-80 transition-opacity mb-1"
            >
              − Remove from "{groups.find(g => g.id === activeGroupId)?.name}"
            </button>
          )}
          <button
            onClick={clearSelection}
            className="text-xs text-[var(--tx-lo)] hover:text-[var(--tx-md)] transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-[var(--border)] text-[var(--tx-lo)] text-[10px] font-mono flex items-center justify-between">
        <span>// click · shift+click range</span>
        <span className="text-[var(--ac-txt)]">{phoneName}</span>
      </div>
    </div>
  );
}
