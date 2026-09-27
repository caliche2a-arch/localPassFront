import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Save, ShieldCheck, Check, AlertTriangle, PlusCircle, Building, Lock, LogIn } from 'lucide-react';
import { MapPicker } from './MapPicker';
import { API_BASE_URL } from '../config';

export function VenueSettings({ token, venue, venues = [], onVenueUpdated, onSelectVenue, onOpenAuth }) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const [name, setName] = useState(venue ? venue.name : '');
  const [address, setAddress] = useState(venue ? venue.address : '');
  const [latitude, setLatitude] = useState(venue ? venue.latitude : 6.2442);
  const [longitude, setLongitude] = useState(venue ? venue.longitude : -75.5812);
  const [geofenceRadius, setGeofenceRadius] = useState(venue ? venue.geofence_radius : 50);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Sync state when selected venue changes
  useEffect(() => {
    if (venue && !isCreatingNew) {
      setName(venue.name);
      setAddress(venue.address);
      setLatitude(venue.latitude);
      setLongitude(venue.longitude);
      setGeofenceRadius(venue.geofence_radius);
    }
  }, [venue, isCreatingNew]);

  const startNewVenue = () => {
    setIsCreatingNew(true);
    setName('');
    setAddress('');
    setLatitude(6.2442);
    setLongitude(-75.5812);
    setGeofenceRadius(50);
    setMessage(null);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGettingLocation(false);
        setMessage({ type: 'success', text: '¡Coordenadas GPS actualizadas con tu ubicación actual!' });
      },
      (err) => {
        setGettingLocation(false);
        alert('No se pudo obtener la ubicación GPS: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: 'Debes iniciar sesión como Administrador de local para guardar o crear sedes.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const endpoint = isCreatingNew ? `${API_BASE_URL}/api/venues` : `${API_BASE_URL}/api/venues/${venue ? venue.id : ''}`;
      const method = isCreatingNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          geofence_radius: Number(geofenceRadius)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el local');

      setMessage({ type: 'success', text: isCreatingNew ? '¡Nuevo local registrado con éxito!' : '¡Configuración del local actualizada con éxito!' });
      setIsCreatingNew(false);
      if (onVenueUpdated) onVenueUpdated(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // If user is not logged in, prompt clean login without any "demo/read-only" text
  if (!token) {
    return (
      <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: 540, margin: '3rem auto' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <Lock size={28} color="#6366f1" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Gestión de Locales Comercial
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          Inicia sesión con tu cuenta de administrador de local para crear nuevas sedes y ajustar el mapa de geolocalización.
        </p>
        {onOpenAuth && (
          <button onClick={onOpenAuth} className="btn-primary" style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}>
            <LogIn size={16} /> Iniciar Sesión / Registrarse
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '1rem' }}>

      {/* Venues Selector Header */}
      {venues.length > 0 && (
        <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mis Locales Registrados:</span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setIsCreatingNew(false); onSelectVenue(v); }}
                  className={!isCreatingNew && venue?.id === v.id ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <Building size={14} /> {v.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startNewVenue} className="btn-secondary" style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: '#34d399' }}>
            <PlusCircle size={16} /> Registrar Nuevo Local
          </button>
        </div>
      )}

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          {isCreatingNew ? 'Registrar Nuevo Local Comercial' : `Configuración de ${name || 'Local'}`}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Define el nombre, la dirección y usa el **mapa interactivo** para ubicar el local y establecer el radio de geocerca anti-fraude.
        </p>

        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Nombre del Local Comercial *</label>
            <input
              type="text"
              required
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Restaurante El Poblado Sede Central"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Dirección Física *</label>
            <input
              type="text"
              required
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Calle 10 # 42-15, Medellín"
            />
          </div>

          {/* Interactive Map Picker */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>
                📍 Ubicación Exacta en el Mapa (Haz clic o arrastra el pin)
              </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {gettingLocation ? 'Obteniendo GPS...' : '📍 Usar mi GPS Actual'}
              </button>
            </div>

            <MapPicker
              latitude={latitude}
              longitude={longitude}
              radius={geofenceRadius}
              onChangeLocation={(newLat, newLng) => {
                setLatitude(newLat);
                setLongitude(newLng);
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="input-label">Latitud</label>
              <input
                type="number"
                step="any"
                required
                className="input-field"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">Longitud</label>
              <input
                type="number"
                step="any"
                required
                className="input-field"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label">Radio de Seguridad de la Geocerca</label>
              <span className="badge badge-green">{geofenceRadius} metros</span>
            </div>
            <input
              type="range"
              min="15"
              max="300"
              step="5"
              className="input-field"
              value={geofenceRadius}
              onChange={(e) => setGeofenceRadius(e.target.value)}
              style={{ cursor: 'pointer', accentColor: '#6366f1' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Los clientes deben estar físicamente a menos de <strong>{geofenceRadius} metros</strong> del local para registrar sus idas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={18} /> {saving ? 'Guardando...' : isCreatingNew ? 'Crear Nuevo Local' : 'Guardar Cambios del Local'}
            </button>
            {isCreatingNew && (
              <button type="button" onClick={() => setIsCreatingNew(false)} className="btn-secondary">
                Cancelar
              </button>
            )}
          </div>

        </form>
      </div>

    </div>
  );
}
