import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Award, Search, ExternalLink, RefreshCw, ShieldCheck, MapPin, Lock, LogIn, X, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

// WhatsApp SVG Icon
const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.885a.5.5 0 0 0 .62.598l6.219-1.601A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.504-5.234-1.384l-.374-.217-3.892 1.002 1.03-3.756-.24-.386A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

// WhatsApp Quick-Send Modal
function WhatsAppModal({ customer, venueName, onClose }) {
  const phone = customer.phone.replace(/[^0-9]/g, '');
  const [message, setMessage] = useState(
    `Hola ${customer.name}, te saludamos desde ${venueName} 👋\n\n¡Gracias por visitarnos! Esperamos verte pronto.`
  );

  const handleSend = () => {
    const url = `https://wa.me/57${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(8px)'
    }} onClick={onClose}>
      <div
        className="glass-card"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 460, padding: '1.75rem', borderRadius: '18px', border: '1px solid rgba(37,211,102,0.3)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366' }}>
              <WhatsAppIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Mensaje WhatsApp</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Para: <strong style={{ color: '#e2e8f0' }}>{customer.name}</strong> · {customer.phone}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Message Editor */}
        <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          ✏️ Edita el mensaje antes de enviar:
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          className="input-field"
          style={{ resize: 'vertical', fontSize: '0.88rem', lineHeight: '1.5', fontFamily: 'inherit' }}
        />

        {/* Quick Templates */}
        <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>💬 Plantillas rápidas:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { label: '🎉 Promoción', text: `Hola ${customer.name}! Tenemos una oferta especial para ti en ${venueName}. ¡No te la pierdas! 🎉` },
              { label: '⭐ Reseña', text: `Hola ${customer.name}, gracias por visitarnos en ${venueName}. ¿Nos dejarías una reseña? Tu opinión nos ayuda mucho 🙏` },
              { label: '📅 Reserva', text: `Hola ${customer.name}! Te invitamos a reservar tu mesa en ${venueName}. ¿Cuándo te gustaría venir? 📅` },
            ].map(tpl => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => setMessage(tpl.text)}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px' }}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button
            onClick={handleSend}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #25d366, #128c7e)',
              color: '#fff', fontWeight: 700, fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(37,211,102,0.5)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(37,211,102,0.35)'; }}
          >
            <WhatsAppIcon size={18} /> Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ token, venueId, onNavigateToNfc, onOpenAuth }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsappTarget, setWhatsappTarget] = useState(null); // { name, phone }

  useEffect(() => {
    // Reset state immediately on token/venue change
    setData(null);
    setError(null);

    if (token) {
      fetchStats();
    }
  }, [token, venueId]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const url = venueId ? `${API_BASE_URL}/api/dashboard/stats?venue_id=${venueId}` : `${API_BASE_URL}/api/dashboard/stats`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar datos del dashboard');
      const statsData = await res.json();
      setData(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, show clear authentication prompt
  if (!token) {
    return (
      <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: 540, margin: '3rem auto' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <Lock size={28} color="#6366f1" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Panel de Control Privado
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          Inicia sesión como dueño de local para ver las estadísticas de tus visitas en tiempo real, clientes registrados y enlaces directos de WhatsApp.
        </p>
        <button onClick={onOpenAuth} className="btn-primary" style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}>
          <LogIn size={16} /> Iniciar Sesión / Registrarme
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" color="#6366f1" style={{ margin: '0 auto 1rem' }} />
        <p className="gradient-text">Cargando métricas del local...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', margin: '2rem auto', maxWidth: 600 }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'No se pudieron obtener datos'}</p>
        <button onClick={fetchStats} className="btn-secondary">Reintentar</button>
      </div>
    );
  }

  if (!data.has_venue) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: 600, margin: '2rem auto' }}>
        <h2>Aún no tienes ningún local registrado</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0 1.5rem' }}>
          Crea tu primer local comercial para empezar a recibir clientes mediante etiquetas NFC y geolocalización.
        </p>
      </div>
    );
  }

  const { venue, stats, customers, recent_visits } = data;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>

      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-green"><ShieldCheck size={12} /> Geocerca Activa ({venue.geofence_radius}m)</span>
            <span className="badge badge-purple"><MapPin size={12} /> {venue.slug}</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }} className="gradient-text">
            {venue.name}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{venue.address}</p>
        </div>

        <button onClick={onNavigateToNfc} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
          <ExternalLink size={16} /> Ver mi NFC & Código QR
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Visitas</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <TrendingUp size={20} color="#6366f1" />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.total_visits}</h2>
          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Registradas vía NFC/GPS</span>
        </div>

        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Clientes Únicos</span>
            <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Users size={20} color="#ec4899" />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.unique_customers}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contactos registrados</span>
        </div>

        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Visitas Hoy</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Calendar size={20} color="#10b981" />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{stats.today_visits}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Día en curso</span>
        </div>

        <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Frecuencia Promedio</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Award size={20} color="#06b6d4" />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.avg_visits}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Idas por cliente</span>
        </div>

      </div>

      {/* Main Grid: Customer Directory & Live Visits Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* Customer Directory */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Directorio de Clientes</h2>
            <span className="badge badge-purple">{filteredCustomers.length} Registrados</span>
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 14 }} />
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {filteredCustomers.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                No se encontraron clientes
              </p>
            ) : (
              filteredCustomers.map(cust => (
                <div
                  key={cust.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem', display: 'block' }}>{cust.name}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>📞 {cust.phone}</span>
                      {cust.email && <span>✉️ {cust.email}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      {cust.visits_count} {cust.visits_count === 1 ? 'visita' : 'visitas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWhatsappTarget({ name: cust.name, phone: cust.phone })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 11px', fontSize: '0.72rem', borderRadius: '8px', border: 'none',
                        cursor: 'pointer', fontWeight: 600,
                        background: 'linear-gradient(135deg, #25d366, #128c7e)',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,211,102,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,211,102,0.35)'; }}
                    >
                      <WhatsAppIcon size={13} /> WhatsApp
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Check-ins Feed */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#10b981" /> Historial Reciente de Visitas
          </h2>

          <div style={{ maxHeight: '470px', overflowY: 'auto' }}>
            {recent_visits.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                Aún no hay visitas registradas hoy.
              </p>
            ) : (
              recent_visits.map(v => (
                <div
                  key={v.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block' }}>{v.customer_name}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Distancia GPS: {Math.round(v.distance_meters)}m
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                      Visita #{v.visits_count}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '65px', textAlign: 'right' }}>
                      {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {v.customer_phone && (
                      <button
                        type="button"
                        onClick={() => setWhatsappTarget({ name: v.customer_name, phone: v.customer_phone })}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 10px', fontSize: '0.72rem', borderRadius: '8px', border: 'none',
                          cursor: 'pointer', fontWeight: 600,
                          background: 'linear-gradient(135deg, #25d366, #128c7e)',
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(37,211,102,0.3)',
                          transition: 'transform 0.15s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <WhatsAppIcon size={12} /> Enviar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* WhatsApp Modal */}
      {whatsappTarget && (
        <WhatsAppModal
          customer={whatsappTarget}
          venueName={venue.name}
          onClose={() => setWhatsappTarget(null)}
        />
      )}

    </div>
  );
}
