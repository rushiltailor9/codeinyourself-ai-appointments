export const INITIAL_SERVICES = [
  {
    id: 'svc-web-consult',
    name: 'Web Development Consultation',
    duration: 30,
    price: 0,
    description: 'Initial scoping call for a new website or web app build.',
    aiActive: true,
    bookedThisMonth: 18,
  },
  {
    id: 'svc-it-support',
    name: 'IT Support Call',
    duration: 20,
    price: 0,
    description: 'Troubleshooting session for existing infrastructure or software.',
    aiActive: true,
    bookedThisMonth: 27,
  },
  {
    id: 'svc-product-strategy',
    name: 'Product Strategy Session',
    duration: 45,
    price: 149,
    description: 'Roadmap and technical architecture planning for new products.',
    aiActive: true,
    bookedThisMonth: 9,
  },
  {
    id: 'svc-security-audit',
    name: 'Security Audit Intro',
    duration: 30,
    price: 0,
    description: 'Scoping call ahead of a full infrastructure security audit.',
    aiActive: false,
    bookedThisMonth: 4,
  },
];

export const INITIAL_TEAM = [
  { id: 'team-neha', name: 'Neha Shah', role: 'Lead Engineer', color: '#5CF2A3' },
  { id: 'team-arjun', name: 'Arjun Mehta', role: 'Solutions Architect', color: '#8FFFC4' },
  { id: 'team-priya', name: 'Priya Nair', role: 'Support Lead', color: '#F2B15C' },
];

const todayISO = new Date().toISOString().split('T')[0];

export const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-1001',
    clientName: 'Eleanor Vance',
    clientEmail: 'eleanor.vance@northfield.io',
    service: 'Web Development Consultation',
    staff: 'Neha Shah',
    date: todayISO,
    time: '11:00',
    duration: 30,
    status: 'confirmed',
    source: 'ai-chat',
  },
  {
    id: 'apt-1002',
    clientName: 'Marcus Diaz',
    clientEmail: 'marcus@diazlogistics.com',
    service: 'IT Support Call',
    staff: 'Priya Nair',
    date: todayISO,
    time: '14:30',
    duration: 20,
    status: 'confirmed',
    source: 'ai-chat',
  },
  {
    id: 'apt-1003',
    clientName: 'Sofia Kowalski',
    clientEmail: 'sofia.k@brightleaf.co',
    service: 'Product Strategy Session',
    staff: 'Arjun Mehta',
    date: todayISO,
    time: '16:00',
    duration: 45,
    status: 'pending',
    source: 'manual',
  },
  {
    id: 'apt-1004',
    clientName: 'Daniel Osei',
    clientEmail: 'daniel@oseiventures.com',
    service: 'IT Support Call',
    staff: 'Priya Nair',
    date: todayISO,
    time: '09:30',
    duration: 20,
    status: 'cancelled',
    source: 'ai-chat',
  },
];

export const INITIAL_CHATS = [
  {
    id: 'eleanor-vance',
    clientName: 'Eleanor Vance',
    clientEmail: 'eleanor.vance@northfield.io',
    previewMessage: "Great, Tuesday at 11 works for me, thanks!",
    actionRequired: null,
    takenOver: false,
    messages: [
      { id: 'm1', sender: 'client', text: 'Hi, I need to book a web dev consultation sometime next week.', timestamp: '09:12' },
      { id: 'm2', sender: 'ai', text: 'Happy to help. I have openings Tuesday at 11:00 or Wednesday at 15:00 — which works better?', timestamp: '09:12' },
      { id: 'm3', sender: 'client', text: 'Great, Tuesday at 11 works for me, thanks!', timestamp: '09:13' },
      { id: 'm4', sender: 'ai', text: "Booked — Web Development Consultation, Tuesday 11:00 with Neha Shah. You'll get a reminder 1 hour before.", timestamp: '09:13' },
    ],
  },
  {
    id: 'marcus-diaz',
    clientName: 'Marcus Diaz',
    clientEmail: 'marcus@diazlogistics.com',
    previewMessage: 'Our server keeps timing out, can someone look today?',
    actionRequired: 'Escalation Suggested',
    takenOver: false,
    messages: [
      { id: 'm1', sender: 'client', text: 'Our server keeps timing out, can someone look today?', timestamp: '13:40' },
      { id: 'm2', sender: 'ai', text: "That sounds urgent. I've booked you the next available IT Support slot today at 14:30 with Priya Nair. She'll call this number.", timestamp: '13:41' },
      { id: 'm3', sender: 'client', text: 'Can someone reply here before then? Not sure I can wait.', timestamp: '13:42' },
    ],
  },
  {
    id: 'sofia-kowalski',
    clientName: 'Sofia Kowalski',
    clientEmail: 'sofia.k@brightleaf.co',
    previewMessage: 'Is Arjun available for a longer session, maybe 90 minutes?',
    actionRequired: 'Admin Active',
    takenOver: true,
    messages: [
      { id: 'm1', sender: 'client', text: 'Is Arjun available for a longer session, maybe 90 minutes?', timestamp: '10:05' },
      { id: 'm2', sender: 'admin', text: "Hi Sofia, this is Priya from the team — I can set that up manually. Thursday 10am work?", timestamp: '10:20' },
    ],
  },
];

export const INITIAL_SETTINGS = {
  businessName: 'Nexora Technologies',
  workingHours: { start: '09:00', end: '18:00' },
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  aiVoiceTone: 'Friendly and concise',
  bufferMinutes: 10,
  reminderTimings: ['24h', '1h'],
  autoEscalateKeywords: ['urgent', 'down', 'broken', 'not working'],
};
