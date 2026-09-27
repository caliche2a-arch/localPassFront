import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, CheckCircle, AlertTriangle, Smartphone, ShieldCheck,
  Navigation, RefreshCw, Clock, Award, User, Phone, Mail, Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config';

// Generates or retrieves a stable unique ID for this device/browser
function getOrCreateDeviceId() {
  let id = localStorage.getItem('localpass_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('localpass_device_id', id);
  }
  return id;
}

export function PublicCheckIn({ venueSlug = 'cafe-gourmet-central' }) {
  const [venue, setVenue]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // GPS
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsError, setGpsError]         = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Whether this device has already registered before
  const [isKnownDevice, setIsKnownDevice] = useState(null); // null = checking, true/false

  // First-time registration form
  const [phone, setPhone] = useState('');
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting]       = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  const deviceId = useRef(getOrCreateDeviceId());

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
      await checkDeviceAndStart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Check if this device is already registered for this venue
  const checkDeviceAndStart = async (venueObj) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/public/verify-customer?slug=${encodeURIComponent(venueObj.slug)}&device_id=${encodeURIComponent(deviceId.current)}`
      );
      const data = await res.json();

      if (data.exists) {
        // Returning customer → auto check-in flow
        setIsKnownDevice(true);
        startGpsAndCheckin(venueObj);
      } else {
        // New customer → show form first
        setIsKnownDevice(false);
        // Still get GPS in the background so it's ready when they submit
        startGpsOnly();
      }
    } catch (e) {
      // If verify fails, assume new customer and show form
      setIsKnownDevice(false);
      startGpsOnly();
    }
  };

  // For RETURNING customers: GPS → auto check-in immediately
  const startGpsAndCheckin = (venueObj) => {
    setIsGettingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización GPS');
      setIsGettingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setIsGettingGps(false);

        const dist = calculateHaversine(coords.lat, coords.lng, venueObj.latitude, venueObj.longitude);

        if (dist <= venueObj.geofence_radius) {
          await doCheckin(coords, venueObj);
        }
        // If outside radius: show distance indicator with retry button
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        setGpsError('Activa el GPS de tu celular para registrar tu visita automáticamente.');
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // For NEW customers: get GPS silently in background while they fill the form
  const startGpsOnly = () => {
    if (!navigator.geolocation) return;
    setIsGettingGps(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsGettingGps(false);
      },
      () => {
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Actual check-in API call
  const doCheckin = async (coords, venueObj, formData = {}) => {
    setSubmitting(true);
    setCheckInResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: venueObj.slug,
          device_id: deviceId.current,
          name: formData.name || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
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
        try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } }); } catch (e) {}
      } else {
        setCheckInResult({
          success: false,
          error: data.error || 'Error al validar la visita',
          message: data.message || 'Ocurrió un error inesperado.'
        });
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

  // Form submit for FIRST-TIME customers
  const handleFirstTimeSubmit = async (e) => {
    e.preventDefault();
    if (!userLocation) {
      alert('Espera un momento mientras se verifica tu ubicación GPS.');
      return;
    }
    await doCheckin(userLocation, venue, { name, phone, email });
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
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  };

  const distanceMeters = userLocation && venue
    ? calculateHaversine(userLocation.lat, userLocation.lng, venue.latitude, venue.longitude)
    : null;
  const isWithinRadius = distanceMeters !== null && distanceMeters <= (venue?.geofence_radius || 50);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="radar-circle scanning">
          <Smartphone size={32} color="#6366f1" />
        </div>
        <h3 className="gradient-text" style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
          Conectando con el local...
        </h3>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error || !venue) {
    return (
      <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Local No Encontrado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          La URL o código NFC/QR escaneado no coincide con ningún local activo.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>

      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className="badge badge-purple"><Smartphone size={12} /> NFC · QR</span>
        </div>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
          <MapPin size={28} color="#ffffff" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">{venue.name}</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{venue.address}</p>
      </div>

      {/* ── RETURNING CUSTOMER: GPS status + auto check-in ────────── */}
      {isKnownDevice === true && !checkInResult && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          {isGettingGps || submitting ? (
            <div>
              <div className="radar-circle scanning" style={{ width: 64, height: 64 }}>
                {submitting ? <CheckCircle size={28} color="#6366f1" /> : <Navigation size={24} color="#6366f1" />}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#a5b4fc', marginTop: '0.5rem' }}>
                {submitting ? 'Registrando tu visita automáticamente...' : 'Verificando tu ubicación GPS...'}
              </p>
            </div>
          ) : gpsError ? (
            <div>
              <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.85rem', color: '#fbbf24', marginBottom: '0.75rem' }}>{gpsError}</p>
              <button onClick={() => startGpsAndCheckin(venue)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Activar GPS e Intentar
              </button>
            </div>
          ) : distanceMeters !== null && !isWithinRadius ? (
            <div>
              <div className="radar-circle invalid" style={{ width: 70, height: 70 }}>
                <AlertTriangle size={36} color="#ef4444" />
              </div>
              <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '0.5rem', display: 'inline-flex' }}>
                ⛔ Fuera de Rango · {distanceMeters}m del local
              </span>
              <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.5rem' }}>
                Acércate al local. El límite es {venue.geofence_radius}m.
              </p>
              <button onClick={() => startGpsAndCheckin(venue)} className="btn-secondary" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ── NEW CUSTOMER: Registration form (first time only) ──────── */}
      {isKnownDevice === false && !checkInResult && (
        <form onSubmit={handleFirstTimeSubmit} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#6366f1" /> Bienvenido(a) — Primer Registro
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Solo lo harás <strong>una vez</strong>. Las próximas visitas serán completamente automáticas. ⚡
            </p>
          </div>

          {/* GPS indicator while filling form */}
          {isGettingGps && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: '1rem', fontSize: '0.78rem', color: '#a5b4fc' }}>
              <Navigation size={14} /> Obteniendo tu ubicación GPS en segundo plano...
            </div>
          )}
          {userLocation && isWithinRadius && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: '1rem', fontSize: '0.78rem', color: '#34d399' }}>
              <ShieldCheck size={14} /> Ubicación validada — estás en el local ✓
            </div>
          )}

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
            disabled={submitting || (!userLocation && !isGettingGps)}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? (
              'Registrando...'
            ) : isGettingGps ? (
              <><Navigation size={16} /> Esperando GPS...</>
            ) : !userLocation ? (
              '⛔ GPS no disponible — activa la ubicación'
            ) : !isWithinRadius ? (
              `⛔ Fuera de rango (${distanceMeters}m del local)`
            ) : (
              <><Send size={18} /> Registrarme y Confirmar Visita</>
            )}
          </button>
        </form>
      )}

      {/* ── SUCCESS ──────────────────────────────────────────────── */}
      {checkInResult?.success && (
        <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }}>
            <CheckCircle size={40} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.25rem' }}>¡Visita Confirmada!</h2>
          <p style={{ fontSize: '0.88rem', color: '#d1fae5', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            {checkInResult.message}
          </p>

          <div style={{ background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                  <Award size={14} /> Total Visitas
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{checkInResult.visits_count}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>en {checkInResult.venue_name || venue?.name}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                  <ShieldCheck size={14} /> GPS Validado
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{distanceMeters ? `${distanceMeters}m` : '✓'}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Presencia confirmada</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', padding: '8px 12px', borderRadius: 10, fontSize: '0.75rem', color: '#a7f3d0', marginTop: '10px' }}>
              <Clock size={14} /> Registrado hoy a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────── */}
      {checkInResult && !checkInResult.success && (
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)' }}>
          <AlertTriangle size={40} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{checkInResult.error}</h3>
          <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: '1.4' }}>{checkInResult.message}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a
          href="https://wa.me/573183763021?text=Hola,%20tengo%20un%20inconveniente%20registrando%20mi%20visita"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary btn-whatsapp"
          style={{ textDecoration: 'none', display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          ¿Problemas? Contactar Soporte
        </a>
      </div>

    </div>
  );
}
