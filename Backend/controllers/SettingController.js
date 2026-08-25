import Setting from '../models/Setting.js';
import TeamMember from '../models/TeamMember.js';
import Availability from '../models/Availability.js';

export async function getSettings(req, res) {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        businessName: 'Nexora Technologies',
        workingHours: { start: '09:00', end: '18:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        aiVoiceTone: 'Friendly and concise',
        bufferMinutes: 10,
        reminderTimings: ['24h', '1h'],
        autoEscalateKeywords: ['urgent', 'down', 'broken', 'not working'],
      });
    }
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req, res) {
  try {
    const {
      businessName,
      workingHours,
      workingDays,
      aiVoiceTone,
      bufferMinutes,
      reminderTimings,
      autoEscalateKeywords,
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (businessName !== undefined) settings.businessName = businessName;
    if (workingHours) {
      if (workingHours.start) settings.workingHours.start = workingHours.start;
      if (workingHours.end) settings.workingHours.end = workingHours.end;
    }
    if (Array.isArray(workingDays)) settings.workingDays = workingDays;
    if (aiVoiceTone !== undefined) settings.aiVoiceTone = aiVoiceTone;
    if (bufferMinutes !== undefined) settings.bufferMinutes = Number(bufferMinutes);
    if (Array.isArray(reminderTimings)) settings.reminderTimings = reminderTimings;
    if (Array.isArray(autoEscalateKeywords)) settings.autoEscalateKeywords = autoEscalateKeywords;

    await settings.save();

    // Synchronize workingHours with the Availability collection for active days
    if (workingHours && (workingHours.start || workingHours.end)) {
      const updateData = {};
      if (workingHours.start) updateData.startTime = workingHours.start;
      if (workingHours.end) updateData.endTime = workingHours.end;
      if (bufferMinutes) updateData.slotDurationMinutes = Number(bufferMinutes) || 30;

      await Availability.updateMany({ active: true }, { $set: updateData });
    }

    return res.json({
      success: true,
      message: 'System settings updated and synced with working hours successfully.',
      settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Team Member CRUD
export async function getTeamMembers(req, res) {
  try {
    let members = await TeamMember.find({ active: true }).sort({ createdAt: 1 });
    if (members.length === 0) {
      const initial = [
        { name: 'Neha Shah', role: 'Lead Engineer', color: '#5CF2A3', email: 'neha@nexora.com', active: true },
        { name: 'Arjun Mehta', role: 'Solutions Architect', color: '#8FFFC4', email: 'arjun@nexora.com', active: true },
        { name: 'Priya Nair', role: 'Support Lead', color: '#F2B15C', email: 'priya@nexora.com', active: true },
      ];
      members = await TeamMember.insertMany(initial);
    }
    return res.json({ success: true, teamMembers: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTeamMember(req, res) {
  try {
    const { name, role, email, phone, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team member name is required.' });
    }

    const newMember = await TeamMember.create({
      name: name.trim(),
      role: role?.trim() || 'Team Member',
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      color: color || '#5CF2A3',
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: `Team member ${newMember.name} created successfully.`,
      teamMember: newMember,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateTeamMember(req, res) {
  try {
    const { id } = req.params;
    const { name, role, email, phone, color, active } = req.body;

    const member = await TeamMember.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    if (name !== undefined) member.name = name.trim();
    if (role !== undefined) member.role = role.trim();
    if (email !== undefined) member.email = email.trim();
    if (phone !== undefined) member.phone = phone.trim();
    if (color !== undefined) member.color = color;
    if (active !== undefined) member.active = Boolean(active);

    await member.save();

    return res.json({
      success: true,
      message: `Team member ${member.name} updated successfully.`,
      teamMember: member,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTeamMember(req, res) {
  try {
    const { id } = req.params;
    const member = await TeamMember.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    const memberName = member.name;
    await TeamMember.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Team member "${memberName}" deleted successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
