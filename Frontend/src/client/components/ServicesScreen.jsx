import React, { useState, useEffect } from 'react';
import { SERVICES as STATIC_SERVICES } from '../utils/aiBookingEngine.js';
import { fetchServices } from '../../api/serviceApi.js';
import { Clock, ArrowRight } from 'lucide-react';

export function ServicesScreen({ onSelectServiceForBooking }) {
  const [services, setServices] = useState(STATIC_SERVICES);

  useEffect(() => {
    fetchServices()
      .then((res) => {
        if (res.success && Array.isArray(res.services) && res.services.length > 0) {
          setServices(
            res.services.map((s) => ({
              name: s.name,
              duration: s.durationMinutes || s.duration || 30,
              price: s.price || 0,
              description: s.description || '',
            }))
          );
        }
      })
      .catch((error) => {
        // Keep static services
        console.log("Service Error",error);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-5 py-16">
      <p className="font-mono text-xs text-signal mb-3">// services</p>
      <h1 className="text-3xl font-bold text-paper mb-2">What we can help with</h1>
      <p className="text-muted mb-10 max-w-lg">Pick a service to jump straight into the AI booking assistant, prefilled and ready.</p>

      <div className="grid sm:grid-cols-2 gap-5">
        {services.map((s) => (
          <div key={s.name} className="bg-ink-800 border border-ink-700 rounded-lg p-6 flex flex-col">
            <h3 className="text-paper font-medium text-lg mb-2">{s.name}</h3>
            <p className="text-sm text-muted flex items-center gap-1.5 mb-6">
              <Clock size={13} /> {s.duration} minutes {s.price > 0 ? `• ₹${s.price}` : ''}
            </p>
            <button
              onClick={() => onSelectServiceForBooking(s.name)}
              className="mt-auto flex items-center gap-1.5 text-sm text-signal hover:text-signal-soft"
            >
              Book this <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
