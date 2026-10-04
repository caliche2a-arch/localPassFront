import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, CheckCircle, AlertTriangle, Smartphone, ShieldCheck,
  Navigation, RefreshCw, Clock, Award, User, Phone, Mail, Send, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config';

// ── Cookie Helpers ──────────────────────────────────────────────────────────
function getCookie(name) {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  } catch (e) {}
  return null;
}

function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {}
}

// ── Deterministic Device Hardware Fingerprint (Screen + GPU + WebGL + Canvas) ─
// Does NOT depend on cookies or localStorage! Survives camera ephemeral webviews & private tabs!
function getDeviceFingerprint() {
  try {
    const parts = [];

    // Screen geometry
    if (typeof window !== 'undefined' && window.screen) {
      parts.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}x${window.devicePixelRatio || 1}`);
    }

    // Timezone
    try {
      parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch (e) {}

    // Hardware & Platform
    if (typeof navigator !== 'undefined') {
      parts.push(navigator.language || '');
      parts.push(navigator.hardwareConcurrency || '');
      parts.push(navigator.platform || '');
    }

    // WebGL Unmasked GPU Renderer
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          parts.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
          parts.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
        }
      }
    } catch (e) {}

    // Canvas 2D graphic rendering hash
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(10, 5, 50, 20);
        ctx.fillStyle = '#ec4899';
        ctx.fillText('LocalPass.nfc', 2, 10);
        parts.push(canvas.toDataURL());
      }
    } catch (e) {}

    // Fast DJB2 hash
    const str = parts.join('###');
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  } catch (e) {
    return 'fp_fallback';
  }
}

// ── Multi-Layer Device ID (localStorage + Cookie + sessionStorage) ──────────
function getOrCreateDeviceId() {
  let id = null;
  try { id = localStorage.getItem('localpass_device_id'); } catch (e) {}
  if (!id) id = getCookie('localpass_device_id');
  if (!id) {
    try { id = sessionStorage.getItem('localpass_device_id'); } catch (e) {}
  }
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }
  // Persist everywhere
  try { localStorage.setItem('localpass_device_id', id); } catch (e) {}
  try { sessionStorage.setItem('localpass_device_id', id); } catch (e) {}
  setCookie('localpass_device_id', id);
  return id;
}

// ── Multi-Layer Phone (venue-scoped + global fallbacks) ──────────────────────
function getStoredPhone(venueSlug) {
  let phone = '';
  try {
    phone = localStorage.getItem(`localpass_phone_${venueSlug}`) ||
            localStorage.getItem('localpass_phone') || '';
  } catch (e) {}
  if (!phone) {
    phone = getCookie(`localpass_phone_${venueSlug}`) || getCookie('localpass_phone') || '';
  }
  if (!phone) {
    try {
      phone = sessionStorage.getItem(`localpass_phone_${venueSlug}`) ||
              sessionStorage.getItem('localpass_phone') || '';
    } catch (e) {}
  }
  return phone;
}

function saveCustomerPhone(venueSlug, phone) {
  if (!phone) return;
  try {
    localStorage.setItem(`localpass_phone_${venueSlug}`, phone);
    localStorage.setItem('localpass_phone', phone);
  } catch (e) {}
  try {
    sessionStorage.setItem(`localpass_phone_${venueSlug}`, phone);
    sessionStorage.setItem('localpass_phone', phone);
  } catch (e) {}
  setCookie(`localpass_phone_${venueSlug}`, phone);
  setCookie('localpass_phone', phone);
}

function getStoredName() {
  try {
    return localStorage.getItem('localpass_customer_name') || getCookie('localpass_customer_name') || '';
  } catch (e) { return ''; }
}

function saveCustomerName(name) {
  if (!name) return;
  try { localStorage.setItem('localpass_customer_name', name); } catch (e) {}
  setCookie('localpass_customer_name', name);
}

export function PublicCheckIn({ venueSlug = 'cafe-gourmet-central' }) {
  const cleanSlug = String(venueSlug).split('?')[0].replace(/\/+$/, '').trim();

  const [venue, setVenue]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // GPS
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsError, setGpsError]         = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Identity state
  const [isKnownDevice, setIsKnownDevice]         = useState(null); // null = checking, true/false
  const [recognizedCustomer, setRecognizedCustomer] = useState(null);

  // First-time or fallback registration form
  const [phone, setPhone] = useState(getStoredPhone(cleanSlug));
  const [name, setName]   = useState(getStoredName());
  const [email, setEmail] = useState('');
  const [isCheckingPhone, setIsCheckingPhone]     = useState(false);
  const [isReturningIdentified, setIsReturningIdentified] = useState(false);
  const [returningInfo, setReturningInfo]         = useState(null);

  const [submitting, setSubmitting]       = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  const deviceId = useRef(getOrCreateDeviceId());
  const fingerprint = useRef(getDeviceFingerprint());

  useEffect(() => {
    fetchVenueInfo();
  }, [cleanSlug]);

  const fetchVenueInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/public/venue/${cleanSlug}`);
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

  // Step 1: Check if this device is already registered (device_id OR hardware fingerprint OR phone)
  const checkDeviceAndStart = async (venueObj) => {
    try {
      const storedPhone = getStoredPhone(venueObj.slug);
      let verifyUrl = `${API_BASE_URL}/api/public/verify-customer?slug=${encodeURIComponent(venueObj.slug)}&device_id=${encodeURIComponent(deviceId.current)}&fingerprint=${encodeURIComponent(fingerprint.current)}`;
      if (storedPhone) {
        verifyUrl += `&phone=${encodeURIComponent(storedPhone)}`;
      }
      const res = await fetch(verifyUrl);
      const data = await res.json();

      if (data.exists) {
        // Returning customer → auto check-in flow 100% zero-form
        setIsKnownDevice(true);
        setRecognizedCustomer(data);
        if (data.name) saveCustomerName(data.name);
        if (data.phone) saveCustomerPhone(venueObj.slug, data.phone);
        startGpsAndCheckin(venueObj);
      } else {
        // New or unrecognized customer → show form
        setIsKnownDevice(false);
        if (storedPhone) {
          lookupPhone(storedPhone, venueObj);
        }
        startGpsOnly();
      }
    } catch (e) {
      // If verify fails, show form
      setIsKnownDevice(false);
      startGpsOnly();
    }
  };

  // Lookup phone dynamically when typed in form
  const lookupPhone = async (phoneVal, venueObj = venue) => {
    const clean = String(phoneVal).replace(/[^0-9]/g, '');
    if (clean.length >= 7 && venueObj) {
      try {
        setIsCheckingPhone(true);
        const res = await fetch(`${API_BASE_URL}/api/public/verify-customer?slug=${encodeURIComponent(venueObj.slug)}&phone=${encodeURIComponent(clean)}&fingerprint=${encodeURIComponent(fingerprint.current)}`);
        const data = await res.json();
        if (data.exists) {
          setName(data.name || '');
          setIsReturningIdentified(true);
          setReturningInfo(data);
          saveCustomerPhone(venueObj.slug, clean);
          if (data.name) saveCustomerName(data.name);
        } else {
          setIsReturningIdentified(false);
          setReturningInfo(null);
        }
      } catch (e) {
      } finally {
        setIsCheckingPhone(false);
      }
    } else if (clean.length < 7) {
      setIsReturningIdentified(false);
      setReturningInfo(null);
    }
  };

  const handlePhoneInputChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      lookupPhone(clean, venue);
    } else if (clean.length < 7) {
      setIsReturningIdentified(false);
      setReturningInfo(null);
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
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
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
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  // Actual check-in API call
  const doCheckin = async (coords, venueObj, formData = {}) => {
    setSubmitting(true);
    setCheckInResult(null);

    const submitPhone = formData.phone || phone || getStoredPhone(venueObj.slug) || undefined;
    const submitName  = formData.name || name || getStoredName() || undefined;

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: venueObj.slug,
          device_id: deviceId.current,
          fingerprint: fingerprint.current,
          name: submitName,
          phone: submitPhone,
          email: formData.email || email || undefined,
          user_lat: coords.lat,
          user_lng: coords.lng
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar teléfono y nombre en múltiples capas para que nunca se pierda
        if (submitPhone) saveCustomerPhone(venueObj.slug, submitPhone);
        if (submitName) saveCustomerName(submitName);

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

  // Form submit for FIRST-TIME or IDENTIFIED returning customers
  const handleFormSubmit = async (e) => {
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

      {/* ── RETURNING CUSTOMER: Auto check-in mode ─────────────────── */}
      {isKnownDevice === true && !checkInResult && (
        <div className="glass-card" style={{ padding: '1.5rem 1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          {recognizedCustomer?.name && (
            <div style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: '0.85rem', color: '#a5b4fc' }}>
              <Sparkles size={14} color="#818cf8" /> ¡Hola, {recognizedCustomer.name}!
            </div>
          )}

          {isGettingGps || submitting ? (
            <div>
              <div className="radar-circle scanning" style={{ width: 64, height: 64 }}>
                {submitting ? <CheckCircle size={28} color="#6366f1" /> : <Navigation size={24} color="#6366f1" />}
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e0e7ff', marginTop: '0.75rem' }}>
                {submitting ? 'Registrando tu visita automáticamente...' : 'Verificando tu presencia en el local...'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Dispositivo reconocido. Registro sin formulario ⚡
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

      {/* ── NEW OR RECONNECTING CUSTOMER FORM ─────────────────────── */}
      {isKnownDevice === false && !checkInResult && (
        <form onSubmit={handleFormSubmit} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#6366f1" />
              {isReturningIdentified ? '¡Te hemos reconocido!' : 'Registro de Visita'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {isReturningIdentified
                ? `Bienvenido(a) de nuevo, ${returningInfo?.name || 'amigo(a)'}. Presiona el botón para confirmar tu visita.`
                : 'Ingresa tus datos una sola vez. Las próximas visitas serán automáticas.'}
            </p>
          </div>

          {/* Banner if customer was recognized by phone */}
          {isReturningIdentified && (
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#34d399" />
              <div style={{ fontSize: '0.82rem', color: '#d1fae5' }}>
                <strong>Cliente Reconocido:</strong> {returningInfo?.name}
                <div style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>
                  Has realizado {returningInfo?.visits_count || 1} visita(s) anteriores.
                </div>
              </div>
            </div>
          )}

          {/* GPS status while filling */}
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

          {/* Phone Field First (Key Identifier) */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Número de Celular *</span>
              {isCheckingPhone && <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>Buscando...</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                required
                placeholder="Ej: 3001234567"
                className="input-field"
                value={phone}
                onChange={handlePhoneInputChange}
                onBlur={() => lookupPhone(phone, venue)}
              />
              <Phone size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Si ya te has registrado antes, escribe tu número para reconocerte de inmediato.
            </p>
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

          {!isReturningIdentified && (
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
          )}

          <button
            type="submit"
            disabled={submitting || (!userLocation && !isGettingGps)}
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {submitting ? (
              'Confirmando visita...'
            ) : isGettingGps ? (
              <><Navigation size={16} /> Esperando GPS...</>
            ) : !userLocation ? (
              '⛔ GPS no disponible — activa la ubicación'
            ) : !isWithinRadius ? (
              `⛔ Fuera de rango (${distanceMeters}m del local)`
            ) : isReturningIdentified ? (
              <><Sparkles size={18} /> Confirmar Visita de {name.split(' ')[0]} ✓</>
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
