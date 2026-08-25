import React, { useState } from 'react';
import { Save, UserPlus } from 'lucide-react';

export default function SettingsView({ settings, teamMembers, onSaveSettings, onAddTeamMember }) {
  const [form, setForm] = useState(settings);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const handleSave = () => onSaveSettings(form);

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    onAddTeamMember({
      id: `team-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Team Member',
      color: '#5CF2A3',
    });
    setNewMemberName('');
    setNewMemberRole('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-paper font-mono">// Settings</h2>

      <div className="bg-ink-800 border border-ink-700 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-mono text-signal">AI voice & logic</h3>
        <div>
          <label className="text-xs text-muted block mb-1.5">AI tone</label>
          <input
            value={form.aiVoiceTone}
            onChange={(e) => setForm({ ...form, aiVoiceTone: e.target.value })}
            className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted block mb-1.5">Working hours start</label>
            <input
              type="time"
              value={form.workingHours.start}
              onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, start: e.target.value } })}
              className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Working hours end</label>
            <input
              type="time"
              value={form.workingHours.end}
              onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, end: e.target.value } })}
              className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5">Buffer between appointments (minutes)</label>
          <input
            type="number"
            value={form.bufferMinutes}
            onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })}
            className="w-32 bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60"
          />
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 text-sm bg-signal text-ink-900 font-semibold px-4 py-2 rounded-md hover:bg-signal-soft">
          <Save size={14} /> Save settings
        </button>
      </div>

      <div className="bg-ink-800 border border-ink-700 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-mono text-signal">Team</h3>
        <div className="space-y-2">
          {teamMembers.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-ink-700 last:border-0">
              <span className="text-paper">{t.name}</span>
              <span className="text-muted text-xs">{t.role}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Name"
            className="flex-1 bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
          />
          <input
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
            placeholder="Role"
            className="flex-1 bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60"
          />
          <button onClick={handleAddMember} className="bg-ink-700 border border-ink-600 text-paper rounded-md p-2.5 hover:border-signal/50">
            <UserPlus size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
