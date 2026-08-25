import React, { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, ArrowLeft } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import DashboardView from './components/DashboardView.jsx';
import CalendarView from './components/CalendarView.jsx';
import ChatLogsView from './components/ChatLogsView.jsx';
import ServicesView from './components/ServicesView.jsx';
import SettingsView from './components/SettingsView.jsx';
import NewAppointmentModal from './components/NewAppointmentModal.jsx';
import ClientProfileModal from './components/ClientProfileModal.jsx';
import HelpModal from './components/HelpModal.jsx';
import AddServiceModal from './components/AddServiceModal.jsx';
import AppointmentDetailModal from './components/AppointmentDetailModal.jsx';

import {
  INITIAL_SERVICES,
  INITIAL_TEAM,
  INITIAL_APPOINTMENTS,
  INITIAL_CHATS,
  INITIAL_SETTINGS,
} from './data/initialData.js';

import {
  getAllAppointmentsAdmin,
  updateAppointmentStatusAdmin,
  createAppointment,
  cancelAppointment,
} from '../api/appointmentApi.js';
import {
  fetchServices,
  createServiceAdmin,
  updateServiceAdmin,
} from '../api/serviceApi.js';
import {
  getChatsAdmin,
  toggleChatTakeover,
  sendAdminReply,
} from '../api/aiApi.js';
import {
  getProfile,
  loginUser,
  logoutUser,
} from '../api/authApi.js';

export default function AdminApp() {
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminLoginForm, setAdminLoginForm] = useState({ email: 'admin@codeinyourself.com', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [services, setServices] = useState(INITIAL_SERVICES);
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  const [activeChatId, setActiveChatId] = useState('eleanor-vance');

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [clientProfileData, setClientProfileData] = useState({
    isOpen: false,
    clientName: '',
    clientDetails: {},
  });

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      setAuthChecking(false);
      return;
    }
    try {
      const res = await getProfile();
      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  // Load live data from backend
  const loadBackendData = async () => {
    try {
      const aptRes = await getAllAppointmentsAdmin();
      if (aptRes.success && Array.isArray(aptRes.appointments) && aptRes.appointments.length > 0) {
        const mapped = aptRes.appointments.map((a) => ({
          id: a._id || a.id,
          clientName: a.clientName,
          clientEmail: a.clientEmail,
          service: a.serviceName,
          staff: a.staff || 'Neha Shah',
          date: a.date,
          time: a.startTime,
          duration: a.duration || 30,
          status: (a.status || 'confirmed').toLowerCase(),
          source: a.source || 'ai-chat',
        }));
        setAppointments(mapped);
      }
    } catch (e) {
      console.warn('Backend appointments fetch notice:', e.message);
    }

    try {
      const svcRes = await fetchServices();
      if (svcRes.success && Array.isArray(svcRes.services) && svcRes.services.length > 0) {
        const mapped = svcRes.services.map((s) => ({
          id: s._id || s.id,
          name: s.name,
          duration: s.durationMinutes || s.duration || 30,
          price: s.price || 0,
          description: s.description || '',
          aiActive: s.status !== false,
          bookedThisMonth: 12,
        }));
        setServices(mapped);
      }
    } catch (e) {
      console.warn('Backend services fetch notice:', e.message);
    }

    try {
      const chatRes = await getChatsAdmin();
      if (chatRes.success && Array.isArray(chatRes.chats) && chatRes.chats.length > 0) {
        setChats(chatRes.chats);
        if (chatRes.chats[0]) {
          setActiveChatId(chatRes.chats[0].id);
        }
      }
    } catch (e) {
      console.warn('Backend chats fetch notice:', e.message);
    }
  };

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTakeover = async (chatId) => {
    try {
      await toggleChatTakeover(chatId);
    } catch (e) {
      console.warn('Takeover API error:', e.message);
    }
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            takenOver: !c.takenOver,
            actionRequired: c.takenOver ? 'Escalation Suggested' : 'Admin Active',
          };
        }
        return c;
      })
    );
  };

  const handleSendMessage = async (chatId, text) => {
    try {
      await sendAdminReply(chatId, text);
    } catch (e) {
      console.warn('Send reply API error:', e.message);
    }
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: 'admin',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return { ...c, messages: [...c.messages, newMsg], previewMessage: text };
        }
        return c;
      })
    );
  };

  const handleUpdateService = async (serviceId, updatedFields) => {
    try {
      if (serviceId && !serviceId.startsWith('svc-')) {
        await updateServiceAdmin(serviceId, updatedFields);
      }
    } catch (e) {
      console.warn('Update service API error:', e.message);
    }
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, ...updatedFields } : s)));
  };

  const handleToggleAiActive = (serviceId) => {
    handleUpdateService(serviceId, { aiActive: !services.find((s) => s.id === serviceId)?.aiActive });
  };

  const handleAddService = async (newService) => {
    try {
      const res = await createServiceAdmin({
        name: newService.name,
        durationMinutes: newService.duration,
        price: newService.price,
        description: newService.description,
        status: true,
      });
      if (res.success && res.service) {
        newService.id = res.service._id;
      }
    } catch (e) {
      console.warn('Create service API error:', e.message);
    }
    setServices((prev) => [newService, ...prev]);
  };

  const handleAddAppointment = async (newApt) => {
    try {
      const res = await createAppointment({
        clientName: newApt.clientName,
        clientEmail: newApt.clientEmail || 'client@example.com',
        serviceName: newApt.service,
        date: newApt.date,
        startTime: newApt.time,
        staff: newApt.staff || 'Neha Shah',
        source: 'manual',
      });
      if (res.success && res.appointment) {
        newApt.id = res.appointment._id;
      }
    } catch (e) {
      console.warn('Create appointment API error:', e.message);
    }
    setAppointments((prev) => [newApt, ...prev]);
  };

  const handleCancelAppointment = async (aptId) => {
    try {
      if (aptId && !aptId.startsWith('apt-')) {
        await cancelAppointment(aptId, 'Cancelled by admin');
      }
    } catch (e) {
      console.warn('Cancel appointment API error:', e.message);
    }
    setAppointments((prev) => prev.map((a) => (a.id === aptId ? { ...a, status: 'cancelled' } : a)));
  };

  const handleAddTeamMember = (newMember) => setTeamMembers((prev) => [...prev, newMember]);
  const handleSaveSettings = (newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }));

  const handleOpenClientProfile = (details, name) => {
    setClientProfileData({ isOpen: true, clientName: name, clientDetails: details || {} });
  };

  const handleSelectChatForClient = (chatId) => {
    if (chatId) setActiveChatId(chatId);
    setActiveTab('chat-logs');
  };

  const handleSelectSearchResult = (targetId, tabName) => {
    if (tabName) setActiveTab(tabName);
    if (targetId) setActiveChatId(targetId);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Operations Overview';
      case 'calendar': return 'Team Calendar & Schedules';
      case 'chat-logs': return 'Live AI Conversation Logs';
      case 'services': return 'Services & Offering Configuration';
      case 'settings': return 'AI Voice, Logic & System Settings';
      default: return 'Codeinyourself AI Booking Admin';
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminLoginForm.email.trim() || !adminLoginForm.password.trim()) {
      setAdminLoginError('Please enter administrator email and password.');
      return;
    }
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const res = await loginUser({
        email: adminLoginForm.email.trim(),
        password: adminLoginForm.password,
      });
      if (res.success && res.user) {
        if (res.user.role !== 'admin') {
          setAdminLoginError('Access denied: This account is a client account and does not have administrator privileges.');
          logoutUser();
          setCurrentUser(null);
        } else {
          setCurrentUser(res.user);
          loadBackendData();
        }
      } else {
        setAdminLoginError(res.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setAdminLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    window.location.href = '/';
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-5">
        <p className="font-mono text-sm text-signal animate-pulse">// Verifying administrator authorization...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-ink-950 bg-grid bg-grid flex items-center justify-center p-5 font-sans">
        <div className="w-full max-w-md bg-ink-900 border border-ink-700 rounded-lg p-7 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-signal/10 border border-signal/40 flex items-center justify-center">
              <Terminal size={17} className="text-signal" />
            </div>
            <div>
              <p className="font-mono text-sm text-paper font-semibold">codeinyourself<span className="text-signal">.</span></p>
              <p className="text-[10px] text-muted -mt-0.5">operations console</p>
            </div>
          </div>

          {currentUser && currentUser.role === 'client' ? (
            <div className="space-y-4">
              <div className="bg-coral/10 border border-coral/30 rounded-md p-4">
                <div className="flex items-center gap-2 text-coral font-semibold text-sm mb-1">
                  <ShieldAlert size={18} />
                  <span>Access Restricted</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  You are currently logged in as <strong className="text-paper">{currentUser.name}</strong> with client role (<code className="text-coral font-mono">client</code>).
                </p>
                <p className="text-xs text-muted mt-2">
                  Clients are not permitted to access the internal management dashboard.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="w-full bg-signal text-ink-900 font-semibold text-sm rounded-md py-2.5 hover:bg-signal-soft transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Return to Client Home
                </button>
                <button
                  onClick={() => { logoutUser(); setCurrentUser(null); }}
                  className="w-full border border-ink-600 text-paper text-sm rounded-md py-2 hover:border-signal/50 transition-colors cursor-pointer"
                >
                  Sign in with Admin Account
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-paper mb-1">Administrator Sign In</h2>
              <p className="text-xs text-muted mb-5">Authenticate to manage appointments, live chat logs, and company availability.</p>

              {adminLoginError && (
                <div className="bg-coral/10 border border-coral/30 rounded-md px-3.5 py-2.5 mb-4">
                  <p className="text-xs text-coral font-mono">{adminLoginError}</p>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono text-muted mb-1">Admin email</label>
                  <input
                    type="email"
                    value={adminLoginForm.email}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, email: e.target.value })}
                    placeholder="admin@codeinyourself.com"
                    className="w-full bg-ink-950 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted mb-1">Password</label>
                  <input
                    type="password"
                    value={adminLoginForm.password}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                    placeholder="Enter password (default: admin123)"
                    className="w-full bg-ink-950 border border-ink-600 rounded-md px-3 py-2 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
                  />
                </div>
                <button
                  type="submit"
                  disabled={adminLoginLoading}
                  className="w-full bg-signal text-ink-900 font-semibold text-sm rounded-md py-2.5 hover:bg-signal-soft transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer disabled:opacity-50"
                >
                  {adminLoginLoading ? 'Verifying credentials...' : 'Enter Admin Console →'}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-ink-800 text-center">
                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="text-xs text-muted hover:text-paper transition-colors font-mono cursor-pointer"
                >
                  ← Return to Client Site
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 bg-grid bg-grid text-paper font-sans antialiased flex flex-col selection:bg-signal selection:text-ink-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadEscalationsCount={chats.filter((c) => c.actionRequired === 'Escalation Suggested').length}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeTabTitle={getTabTitle()}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSelectSearchResult={handleSelectSearchResult}
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
        chats={chats}
        appointments={appointments}
      />

      <main className="flex-1 md:ml-[260px] mt-16 p-4 sm:p-6 lg:p-8 transition-all overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              appointments={appointments}
              chats={chats}
              onNavigateToTab={setActiveTab}
              onSelectChatForClient={handleSelectChatForClient}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              appointments={appointments}
              teamMembers={teamMembers}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onSelectAppointment={(apt) => setSelectedAppointment(apt)}
            />
          )}

          {activeTab === 'chat-logs' && (
            <ChatLogsView
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={setActiveChatId}
              onOpenClientProfile={handleOpenClientProfile}
              onSendMessage={handleSendMessage}
              onToggleTakeover={handleToggleTakeover}
            />
          )}

          {activeTab === 'services' && (
            <ServicesView
              services={services}
              onUpdateService={handleUpdateService}
              onToggleAiActive={handleToggleAiActive}
              onOpenAddServiceModal={() => setIsAddServiceOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              teamMembers={teamMembers}
              onSaveSettings={handleSaveSettings}
              onAddTeamMember={handleAddTeamMember}
            />
          )}
        </div>
      </main>

      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        services={services}
        teamMembers={teamMembers}
        onAddAppointment={handleAddAppointment}
      />

      <ClientProfileModal
        isOpen={clientProfileData.isOpen}
        onClose={() => setClientProfileData({ isOpen: false, clientName: '', clientDetails: {} })}
        clientName={clientProfileData.clientName}
        clientDetails={clientProfileData.clientDetails}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onAddService={handleAddService}
      />

      <AppointmentDetailModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onCancelAppointment={handleCancelAppointment}
      />
    </div>
  );
}
