import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertTriangle, Smartphone, ShieldCheck, User, Phone, Mail, Navigation, RefreshCw, Sparkles, Send, Award, Calendar, Heart, Gift, Star, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config';

export function PublicCheckIn({ venueSlug = 'cafe-gourmet-central' }) {
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State initialized from localStorage if available
  const [phone, setPhone] = useState(localStorage.getItem('localpass_customer_phone') || '');
  const [name, setName] = useState(localStorage.getItem('localpass_customer_name') || '');
  const [email, setEmail] = useState(localStorage.getItem('localpass_customer_email') || '');

  // GPS State
  const [userLocation, setUserLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [userDistance, setUserDistance] = useState(null);

  // Result state
  const [checkInResult, setCheckInResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVenueInfo();
  }, [venueSlug]);

  const fetchVenueInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/public/venue/${venueSlug}`);
      if (!res.ok) throw new Error('No se pudo encontrar la información del local');
      const data = await res.json();
      setVenue(data);
      requestGpsLocation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestGpsLocation = (venueObj = venue) => {
    setIsGettingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización GPS');
      setIsGettingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setIsGettingGps(false);

        if (venueObj) {
          const dist = calculateHaversine(coords.lat, coords.lng, venueObj.latitude, venueObj.longitude);
          setUserDistance(dist);

          // AUTO CHECK-IN: If customer has already registered before (saved in localStorage) and is physically inside the venue
          const savedPhone = localStorage.getItem('localpass_customer_phone');
          const savedName = localStorage.getItem('localpass_customer_name');
          const savedEmail = localStorage.getItem('localpass_customer_email') || '';

          if (savedPhone && savedName && dist <= venueObj.geofence_radius) {
            autoProcessCheckIn(savedPhone, savedName, savedEmail, coords, venueObj);
          }
        }
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        setGpsError('Por favor permite el acceso a la ubicación GPS de tu celular para validar que estás en el local.');
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const autoProcessCheckIn = async (custPhone, custName, custEmail, coords, venueObj) => {
    setSubmitting(true);
    setCheckInResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: venueObj ? venueObj.slug : venueSlug,
          phone: custPhone,
          name: custName,
          email: custEmail,
          user_lat: coords.lat,
          user_lng: coords.lng
        })
      });

      const data = await res.json();

      if (res.ok) {
        setCheckInResult({
          success: true,
          message: data.message,
          visits_count: data.visits_count,
          is_first_visit: data.is_first_visit,
          venue_name: data.venue_name,
          customer_name: data.customer_name
        });

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error en autocheckin:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!userLocation) {
      alert('Debes permitir el acceso a la ubicación GPS para registrar tu visita.');
      return;
    }

    setSubmitting(true);
    setCheckInResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: venueSlug,
          phone,
          name,
          email,
          user_lat: userLocation.lat,
          user_lng: userLocation.lng
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckInResult({
          success: false,
          error: data.error || 'Error al validar la visita',
          message: data.message || 'Ocurrió un error inesperado.',
          distance: data.distance_meters,
          maxRadius: data.max_allowed_radius
        });
      } else {
        // Save customer details in phone browser for instant 1-tap checkin on future visits
        try {
          localStorage.setItem('localpass_customer_phone', phone);
          localStorage.setItem('localpass_customer_name', name);
          if (email) localStorage.setItem('localpass_customer_email', email);
        } catch (e) {}

        setCheckInResult({
          success: true,
          message: data.message,
          visits_count: data.visits_count,
          is_first_visit: data.is_first_visit,
          venue_name: data.venue_name,
          customer_name: data.customer_name
        });

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (err) {
      setCheckInResult({
        success: false,
        error: 'Error de conexión',
        message: 'No se pudo contactar al servidor. Verifica tu conexión a internet.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="radar-circle scanning">
          <Smartphone size={32} color="#6366f1" />
        </div>
        <h3 className="gradient-text" style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
          Conectando con la etiqueta NFC del local...
        </h3>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Local No Encontrado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          La URL o código NFC escaneado no coincide con ningún local activo.
        </p>
        <a href="tel:3183763021" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <Phone size={16} /> Contactar Soporte (3183763021)
        </a>
      </div>
    );
  }

  const distanceMeters = userLocation && venue ? calculateHaversine(userLocation.lat, userLocation.lng, venue.latitude, venue.longitude) : null;
  const isWithinRadius = distanceMeters !== null && distanceMeters <= venue.geofence_radius;

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className="badge badge-purple">
            <Smartphone size={12} /> NFC Activo
          </span>
        </div>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
          <MapPin size={28} color="#ffffff" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">{venue.name}</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {venue.address}
        </p>
      </div>

      {/* GPS Location Status Indicator */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        {isGettingGps ? (
          <div>
            <div className="radar-circle scanning" style={{ width: 64, height: 64 }}>
              <Navigation size={24} color="#6366f1" />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#a5b4fc' }}>Obteniendo ubicación GPS de tu celular...</p>
          </div>
        ) : gpsError ? (
          <div>
            <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.85rem', color: '#fbbf24', marginBottom: '0.75rem' }}>{gpsError}</p>
            <button onClick={() => requestGpsLocation()} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
              <RefreshCw size={14} /> Permitir Ubicación GPS
            </button>
          </div>
        ) : (
          <div>
            <div className={`radar-circle ${isWithinRadius ? 'valid' : 'invalid'}`} style={{ width: 70, height: 70 }}>
              {isWithinRadius ? (
                <ShieldCheck size={36} color="#10b981" />
              ) : (
                <AlertTriangle size={36} color="#ef4444" />
              )}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              {isWithinRadius ? (
                <div>
                  <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    <CheckCircle size={14} /> Ubicación Validada ({distanceMeters}m del local)
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Estás dentro del radio seguro permitido de {venue.geofence_radius}m.
                  </p>
                </div>
              ) : (
                <div>
                  <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    ⛔ Fuera de Rango ({distanceMeters}m del local)
                  </span>
                  <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.5rem' }}>
                    El límite máximo es {venue.geofence_radius}m. Debes estar físicamente en el establecimiento.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Result View */}
      {checkInResult && checkInResult.success && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)' }}>
            <CheckCircle size={40} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.25rem' }}>
            ¡Visita Confirmada!
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#d1fae5', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            {checkInResult.message}
          </p>

          {/* Customer Loyalty Stats Grid */}
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Cliente</span>
                <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{checkInResult.customer_name || name}</strong>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                <Award size={13} /> {checkInResult.visits_count >= 10 ? 'VIP Platinum' : checkInResult.visits_count >= 5 ? 'Frecuente Gold' : 'Cliente Frecuente'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                  <Award size={14} /> Total Visitas
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {checkInResult.visits_count}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  en {checkInResult.venue_name || venue?.name}
                </span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                  <ShieldCheck size={14} /> Validación GPS
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {distanceMeters ? `${distanceMeters}m` : '0m'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                  Presencia en sitio
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: 10, fontSize: '0.75rem', color: '#a7f3d0' }}>
              <Clock size={14} /> Registrado hoy a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <button onClick={() => setCheckInResult(null)} className="btn-secondary" style={{ width: '100%' }}>
            Entendido
          </button>
        </div>
      )}

      {/* Security Violation Error View */}
      {checkInResult && !checkInResult.success && (
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <AlertTriangle size={40} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            {checkInResult.error}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: '1.4', marginBottom: '1rem' }}>
            {checkInResult.message}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Si la señal GPS no es precisa en tu celular, intenta acercarte a las mesas o comunicarte con el soporte.
          </p>
        </div>
      )}

      {/* Check-in Form (ONLY for NEW FIRST-TIME CUSTOMERS) */}
      {(!checkInResult || !checkInResult.success) && !localStorage.getItem('localpass_customer_phone') && (
        <form onSubmit={handleCheckInSubmit} className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#6366f1" /> Registrar Entrada
            </h2>
            {localStorage.getItem('localpass_customer_phone') && (
              <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                ⚡ Datos Recordados
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Número de Celular *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                required
                placeholder="Ej: 3001234567"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Phone size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Nombre Completo *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                placeholder="Ej: María Gómez"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <User size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Correo Electrónico (Opcional)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Ej: maria@ejemplo.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isWithinRadius}
            className="btn-primary"
          >
            {submitting ? (
              'Registrando visita...'
            ) : !isWithinRadius ? (
              '⛔ GPS Fuera de Rango'
            ) : (
              <>
                <Send size={18} /> Confirmar Visita
              </>
            )}
          </button>
        </form>
      )}

      {/* Support direct footer */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          ¿Problemas con el registro o necesitas soporte?
        </p>
        <a
          href="https://wa.me/573183763021?text=Hola,%20tengo%20un%20inconveniente%20registrando%20mi%20visita"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary btn-whatsapp"
          style={{ textDecoration: 'none', display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Phone size={14} /> Soporte WhatsApp: 3183763021
        </a>
      </div>

    </div>
  );
}
