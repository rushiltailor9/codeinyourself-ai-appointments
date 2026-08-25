import React, { useState } from 'react';
import { Terminal, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { loginUser, registerUser } from '../../api/authApi.js';

export function LoginScreen({ onLoginSuccess, onBackToHome }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegister) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        setError('Please fill in your name, email, and password.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      try {
        const res = await registerUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        });

        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setError(res.message || 'Registration failed.');
        }
      } catch (err) {
        setError(err.message || 'Error creating account. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Please enter both your email and password.');
        return;
      }
      setLoading(true);
      try {
        const res = await loginUser({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim() || undefined,
        });

        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setError(res.message || 'Invalid credentials.');
        }
      } catch (err) {
        setError(err.message || 'Login failed. Please verify your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-ink-900 bg-grid bg-grid px-5 py-10">
      <div className="w-full max-w-md bg-ink-800 border border-ink-700 rounded-lg p-7 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-signal/10 border border-signal/40 flex items-center justify-center">
              <Terminal size={15} className="text-signal" />
            </div>
            <span className="font-mono text-sm text-paper">
              nexora<span className="text-signal">.</span>
            </span>
          </div>

          <div className="flex bg-ink-900 border border-ink-700 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${!isRegister ? 'bg-signal text-ink-900 font-semibold' : 'text-muted hover:text-paper'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${isRegister ? 'bg-signal text-ink-900 font-semibold' : 'text-muted hover:text-paper'
                }`}
            >
              Register
            </button>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-paper mb-1">
          {isRegister ? 'Create client account' : 'Client sign in'}
        </h1>
        <p className="text-sm text-muted mb-6">
          {isRegister
            ? 'Register to book, view, and manage your AI appointments.'
            : 'Access your appointments, booking history, and active consultations.'}
        </p>

        {error && (
          <div className="bg-coral/10 border border-coral/30 rounded-md px-3.5 py-2.5 mb-4">
            <p className="text-xs text-coral font-mono">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-signal/10 border border-signal/30 rounded-md px-3.5 py-2.5 mb-4">
            <p className="text-xs text-signal font-mono">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-mono text-muted mb-1">Full name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-muted" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-ink-900 border border-ink-600 rounded-md pl-9 pr-3 py-2.5 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-muted mb-1">Email address *</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-muted" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className="w-full bg-ink-900 border border-ink-600 rounded-md pl-9 pr-3 py-2.5 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-mono text-muted mb-1">Phone number (optional)</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-3 text-muted" />
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 12345 67890"
                  className="w-full bg-ink-900 border border-ink-600 rounded-md pl-9 pr-3 py-2.5 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-muted mb-1">Password *</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-muted" />
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isRegister ? 'At least 6 characters' : 'Enter password'}
                className="w-full bg-ink-900 border border-ink-600 rounded-md pl-9 pr-3 py-2.5 text-sm text-paper placeholder:text-muted focus:outline-none focus:border-signal/60 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal text-ink-900 font-semibold text-sm rounded-md py-2.5 hover:bg-signal-soft transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : isRegister ? (
              <>
                <span>Register & Continue</span>
                <ArrowRight size={15} />
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-ink-700 text-center">
          <p className="text-xs text-muted">
            {isRegister ? 'Already registered?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-signal hover:underline font-mono"
            >
              {isRegister ? 'Sign in here' : 'Create an account'}
            </button>
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="w-full text-center text-xs text-muted hover:text-paper mt-4 transition-colors"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
