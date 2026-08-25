import React, { useState, useEffect } from 'react';
import {
  Save,
  UserPlus,
  Trash2,
  Edit2,
  Clock,
  Bot,
  Users,
  AlertTriangle,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsView({
  settings,
  teamMembers,
  onSaveSettings,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
}) {
  const [form, setForm] = useState({
    businessName: 'Nexora Technologies',
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    aiVoiceTone: 'Friendly and concise',
    bufferMinutes: 10,
    reminderTimings: ['24h', '1h'],
    autoEscalateKeywords: ['urgent', 'down', 'broken', 'not working'],
  });

  const [isSaving, setIsSaving] = useState(false);

  // Add member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Edit member state
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', email: '' });

  // Delete confirmation modal state
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        businessName: settings.businessName || 'Nexora Technologies',
        workingHours: {
          start: settings.workingHours?.start || '09:00',
          end: settings.workingHours?.end || '18:00',
        },
        workingDays: settings.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        aiVoiceTone: settings.aiVoiceTone || 'Friendly and concise',
        bufferMinutes: settings.bufferMinutes !== undefined ? settings.bufferMinutes : 10,
        reminderTimings: settings.reminderTimings || ['24h', '1h'],
        autoEscalateKeywords: settings.autoEscalateKeywords || ['urgent', 'down', 'broken', 'not working'],
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.workingHours.start || !form.workingHours.end) {
      alert('Please specify valid start and end working hours.');
      return;
    }
    if (form.workingHours.start >= form.workingHours.end) {
      alert('Working hours start time must be earlier than end time.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveSettings(form);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkingDay = (day) => {
    setForm((prev) => {
      const exists = prev.workingDays.includes(day);
      const updated = exists
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: updated };
    });
  };

  const handleAddMember = async (e) => {
    e?.preventDefault();
    if (!newMemberName.trim()) return;

    await onAddTeamMember({
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Team Member',
      email: newMemberEmail.trim(),
    });

    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
  };

  const startEdit = (member) => {
    setEditingMemberId(member.id || member._id);
    setEditForm({
      name: member.name,
      role: member.role || 'Team Member',
      email: member.email || '',
    });
  };

  const cancelEdit = () => {
    setEditingMemberId(null);
    setEditForm({ name: '', role: '', email: '' });
  };

  const handleSaveEdit = async (memberId) => {
    if (!editForm.name.trim()) return;
    await onUpdateTeamMember(memberId, {
      name: editForm.name.trim(),
      role: editForm.role.trim() || 'Team Member',
      email: editForm.email.trim(),
    });
    setEditingMemberId(null);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTeamMember(memberToDelete.id || memberToDelete._id);
      setMemberToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-paper font-mono flex items-center gap-2">
            <Bot size={20} className="text-signal" />
            // System & Availability Settings
          </h2>
          <p className="text-xs text-muted mt-1">
            Configure business hours, start & end times, AI behavior, and manage team members.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 text-sm bg-signal text-ink-900 font-semibold px-4 py-2 rounded-md hover:bg-signal-soft transition-colors cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save size={15} />
          {isSaving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {/* Section 1: Business Hours & Availability */}
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 space-y-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-signal/10 border border-signal/30 text-signal">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-paper font-mono">Business Operating Hours & Timing</h3>
              <p className="text-xs text-muted">Sets the working hours window for client bookings and AI scheduling.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-ink-950 border border-ink-800 rounded-lg p-4 space-y-2">
            <label className="text-xs font-mono text-signal uppercase tracking-wider block">
              Start Time (Opening)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={form.workingHours.start}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workingHours: { ...form.workingHours, start: e.target.value },
                  })
                }
                className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-base font-mono text-paper focus:outline-none focus:border-signal/60"
              />
            </div>
            <p className="text-[11px] text-muted">Earliest appointment slot clients can book.</p>
          </div>

          <div className="bg-ink-950 border border-ink-800 rounded-lg p-4 space-y-2">
            <label className="text-xs font-mono text-signal uppercase tracking-wider block">
              End Time (Closing)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={form.workingHours.end}
                onChange={(e) =>
                  setForm({
                    ...form,
                    workingHours: { ...form.workingHours, end: e.target.value },
                  })
                }
                className="w-full bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-base font-mono text-paper focus:outline-none focus:border-signal/60"
              />
            </div>
            <p className="text-[11px] text-muted">Latest cutoff time for appointments.</p>
          </div>
        </div>

        {/* Working Days */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-mono text-muted uppercase tracking-wider block">
            Active Working Days
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const active = form.workingDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                    active
                      ? 'bg-signal/15 border-signal text-signal font-semibold shadow-sm'
                      : 'bg-ink-950 border-ink-700 text-muted hover:border-ink-600'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buffer Minutes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted block">
              Buffer / Slot Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              step="5"
              value={form.bufferMinutes}
              onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })}
              className="w-full bg-ink-950 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60 font-mono"
            />
            <p className="text-[11px] text-muted">Interval step used for calendar time slots.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-muted block">
              Company / Business Name
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full bg-ink-950 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60 font-mono"
            />
            <p className="text-[11px] text-muted">Displayed in client booking and reminders.</p>
          </div>
        </div>
      </div>

      {/* Section 2: AI Voice Tone & Escalation */}
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 space-y-5 shadow-lg">
        <div className="flex items-center gap-2.5 border-b border-ink-800 pb-3">
          <div className="p-2 rounded-md bg-signal/10 border border-signal/30 text-signal">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-paper font-mono">AI Voice Tone & Persona</h3>
            <p className="text-xs text-muted">Guides how the AI receptionist communicates with clients.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted block mb-1.5">AI Response Persona & Tone</label>
            <input
              value={form.aiVoiceTone}
              onChange={(e) => setForm({ ...form, aiVoiceTone: e.target.value })}
              placeholder="e.g. Friendly, professional, concise, empathetic"
              className="w-full bg-ink-950 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60 font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted block mb-1.5">
              Auto-Escalate Keywords (comma separated)
            </label>
            <input
              value={Array.isArray(form.autoEscalateKeywords) ? form.autoEscalateKeywords.join(', ') : ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  autoEscalateKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="urgent, down, emergency, broken"
              className="w-full bg-ink-950 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:border-signal/60 font-mono"
            />
            <p className="text-[11px] text-muted mt-1">
              Triggers admin escalation tag in chat logs when clients mention these phrases.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Team Management (Add, Update, Delete with Confirmation) */}
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 space-y-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-ink-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-signal/10 border border-signal/30 text-signal">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-paper font-mono">Team Members & Staff</h3>
              <p className="text-xs text-muted">Manage assignable staff members for appointments and schedule filtering.</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-ink-800 border border-ink-700 px-2.5 py-1 rounded text-paper">
            {teamMembers.length} Members
          </span>
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          {teamMembers.map((member) => {
            const memberId = member.id || member._id;
            const isEditingThis = editingMemberId === memberId;

            if (isEditingThis) {
              return (
                <div
                  key={memberId}
                  className="bg-ink-950 border border-signal/50 rounded-lg p-4 space-y-3 transition-all"
                >
                  <p className="text-xs font-mono text-signal">// Edit Team Member</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="bg-ink-900 border border-ink-600 rounded px-3 py-1.5 text-xs text-paper focus:outline-none focus:border-signal"
                    />
                    <input
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      placeholder="Role (e.g. Support Lead)"
                      className="bg-ink-900 border border-ink-600 rounded px-3 py-1.5 text-xs text-paper focus:outline-none focus:border-signal"
                    />
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email address"
                      className="bg-ink-900 border border-ink-600 rounded px-3 py-1.5 text-xs text-paper focus:outline-none focus:border-signal"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={cancelEdit}
                      className="px-2.5 py-1 text-xs border border-ink-600 text-muted rounded hover:text-paper"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(memberId)}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-signal text-ink-900 font-semibold rounded hover:bg-signal-soft"
                    >
                      <Check size={13} /> Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={memberId}
                className="flex items-center justify-between p-3 bg-ink-950 border border-ink-800 rounded-lg hover:border-ink-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-signal/10 border border-signal/30 text-signal flex items-center justify-center font-bold text-xs font-mono shadow-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-paper leading-tight">{member.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted font-mono">{member.role || 'Team Member'}</span>
                      {member.email && (
                        <span className="text-[11px] text-ink-500 font-mono">({member.email})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(member)}
                    title="Edit Team Member"
                    className="p-1.5 text-muted hover:text-signal hover:bg-ink-800 rounded transition-colors cursor-pointer"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setMemberToDelete(member)}
                    title="Delete Team Member"
                    className="p-1.5 text-muted hover:text-coral hover:bg-coral/10 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Team Member Form */}
        <form onSubmit={handleAddMember} className="bg-ink-950 border border-ink-800 rounded-lg p-4 space-y-3">
          <p className="text-xs font-mono text-signal">// Add New Team Member</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Name *"
              className="bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-xs text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
            />
            <input
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              placeholder="Role (e.g. Solutions Architect)"
              className="bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-xs text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
            />
            <input
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Email (optional)"
              className="bg-ink-900 border border-ink-600 rounded-md px-3 py-2 text-xs text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={!newMemberName.trim()}
              className="flex items-center gap-1.5 bg-signal text-ink-900 font-semibold text-xs px-4 py-2 rounded-md hover:bg-signal-soft transition-colors cursor-pointer disabled:opacity-40"
            >
              <UserPlus size={14} /> Add Team Member
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-coral">
              <div className="p-2.5 rounded-full bg-coral/15 border border-coral/30">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-paper font-mono">Confirm Team Member Deletion</h3>
                <p className="text-xs text-muted">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-paper bg-ink-950 p-3.5 rounded border border-ink-800 leading-relaxed">
              Are you sure you want to remove <strong className="text-signal">{memberToDelete.name}</strong> (
              <span className="text-muted text-xs font-mono">{memberToDelete.role || 'Team Member'}</span>) from your
              team list?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md text-xs font-semibold border border-ink-600 text-paper hover:bg-ink-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMember}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-coral text-white hover:bg-coral/80 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting...' : 'Yes, Delete Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
