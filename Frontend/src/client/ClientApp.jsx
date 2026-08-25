import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Navbar } from './components/Navbar.jsx';
import { HomeScreen } from './components/HomeScreen.jsx';
import { ServicesScreen } from './components/ServicesScreen.jsx';
import { PortfolioScreen } from './components/PortfolioScreen.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { ClientPortal } from './components/ClientPortal.jsx';
import { Footer } from './components/Footer.jsx';
import { Modals } from './components/Modals.jsx';
import { getMyAppointments, cancelAppointment } from '../api/appointmentApi.js';
import { logoutUser, getProfile } from '../api/authApi.js';

export default function ClientApp() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [prefillService, setPrefillService] = useState('');
  const [modalType, setModalType] = useState(null);

  // Restore authenticated user profile on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then((res) => {
          if (res.success && res.user) {
            setUser({
              id: res.user._id,
              name: res.user.name,
              email: res.user.email,
              phone: res.user.phone,
              role: res.user.role,
              company: 'Enterprise Partner',
            });
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  const fetchBookings = async (email) => {
    try {
      const res = await getMyAppointments(email);
      if (res.success && Array.isArray(res.appointments)) {
        const mapped = res.appointments.map((a) => ({
          id: a._id || a.id,
          clientName: a.clientName,
          clientEmail: a.clientEmail,
          service: a.serviceName || a.service,
          date: a.date,
          time: a.startTime || a.time,
          status: (a.status || 'confirmed').toLowerCase(),
        }));
        setBookings(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch appointments from backend:', err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchBookings(user.email);
    }
  }, [user]);

  const handleBookingConfirmed = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
    toast.success(`🎉 Appointment confirmed for ${newBooking.service || newBooking.serviceName || 'Consultation'} on ${newBooking.date} at ${newBooking.time || newBooking.startTime}!`);
    if (user?.email) {
      fetchBookings(user.email);
    }
  };

  const handleSelectServiceForBooking = (serviceName) => {
    setPrefillService(serviceName);
    setCurrentScreen('home');
    toast.info(`Selected ${serviceName} for booking consultation.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProjectForBooking = (projectName) => {
    setPrefillService(`Project scope similar to ${projectName}`);
    setCurrentScreen('home');
    toast.info(`Configured project scope for consultation.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    toast.success(`Welcome, ${loggedInUser.name}!`);
    if (loggedInUser.role === 'admin') {
      window.location.href = '/admin';
      return;
    }
    // Client user navigates directly to Home Page
    setCurrentScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (loggedInUser.email) {
      fetchBookings(loggedInUser.email);
    }
  };

  const handleCancelBooking = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId, 'Cancelled by client');
      setBookings((prev) =>
        prev.map((b) => (b.id === appointmentId ? { ...b, status: 'cancelled' } : b))
      );
      toast.warning('Appointment slot has been cancelled.');
      if (user?.email) {
        fetchBookings(user.email);
      }
    } catch (err) {
      console.warn('Cancel appointment error:', err);
      toast.error(err.message || 'Could not cancel appointment.');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setBookings([]);
    toast.info('You have been signed out.');
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-900 font-sans text-paper antialiased selection:bg-signal selection:text-ink-900">
      {currentScreen !== 'login' && (
        <Navbar
          currentScreen={currentScreen}
          onNavigate={(screen) => {
            setCurrentScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <div className="flex-grow flex flex-col">
        {currentScreen === 'home' && (
          <HomeScreen
            prefillService={prefillService}
            onBookingConfirmed={handleBookingConfirmed}
            onOpenPortal={() => setCurrentScreen(user ? 'portal' : 'login')}
            onExploreServices={() => { setCurrentScreen('services'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onExplorePortfolio={() => { setCurrentScreen('portfolio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            user={user}
            onRequireLogin={() => { setCurrentScreen('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {currentScreen === 'services' && (
          <ServicesScreen
            onSelectServiceForBooking={handleSelectServiceForBooking}
            onOpenModal={setModalType}
          />
        )}

        {currentScreen === 'portfolio' && (
          <PortfolioScreen
            onDiscussProject={() => { setCurrentScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onSelectProjectForBooking={handleSelectProjectForBooking}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen onLoginSuccess={handleLoginSuccess} onBackToHome={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'portal' && (
          <ClientPortal
            user={user}
            bookings={bookings}
            onBookNewConsultation={() => { setCurrentScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onLogout={handleLogout}
            onCancelAppointment={handleCancelBooking}
          />
        )}
      </div>

      {currentScreen !== 'login' && <Footer onOpenModal={setModalType} dark={currentScreen === 'portal'} />}

      <Modals modalType={modalType} onClose={() => setModalType(null)} />
    </div>
  );
}
