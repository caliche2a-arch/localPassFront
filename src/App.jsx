import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Smartphone, QrCode, Settings, Headphones, LogIn, LogOut, ShieldCheck, MapPin, Sparkles, UserCheck, Building, Crown, DollarSign } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { PublicCheckIn } from './components/PublicCheckIn';
import { NfcQrGenerator } from './components/NfcQrGenerator';
import { VenueSettings } from './components/VenueSettings';
import { SupportSection } from './components/SupportSection';
import { AuthModal } from './components/AuthModal';
import { API_BASE_URL } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState(localStorage.getItem('localpass_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('localpass_user') || 'null'));
  const [venues, setVenues] = useState([]);
  const [currentVenue, setCurrentVenue] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isSuperAdmin = user && (user.email === 'admin@localpass.com' || user.role === 'admin' || user.role === 'superadmin');

  // Check URL Hash for direct route like /#/checkin/cafe-gourmet-central
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/checkin/')) {
        setActiveTab('checkin');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch logged in user venue details
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/venues`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Token inválido o expirado');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setVenues(data);
            if (data.length > 0) {
              setCurrentVenue(data[0]);
            } else {
              setCurrentVenue(null);
            }
          }
        })
        .catch(err => {
          console.warn('Session expired, clearing credentials:', err);
          handleLogout();
        });
    } else {
      setVenues([]);
      setCurrentVenue(null);
    }
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setVenues([]);
    setCurrentVenue(null);
    localStorage.setItem('localpass_token', newToken);
    localStorage.setItem('localpass_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setVenues([]);
    setCurrentVenue(null);
    localStorage.removeItem('localpass_token');
    localStorage.removeItem('localpass_user');
    window.location.hash = '';
  };

  const getSlugFromHash = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/checkin/')) {
      return hash.replace('#/checkin/', '');
    }
    return currentVenue ? currentVenue.slug : 'cafe-gourmet-central';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.85rem 1.5rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo & Brand */}
          <div 
            onClick={() => { setActiveTab('dashboard'); window.location.hash = ''; }} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)' }}>
              <Building size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                  LocalPass
                </span>
                {isSuperAdmin ? (
                  <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                    <Crown size={9} /> Admin
                  </span>
                ) : (
                  <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>Activo</span>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.02em', lineHeight: 1, display: 'block', marginTop: '2px' }}>
                Registro de clientes para tu local
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setActiveTab('dashboard'); window.location.hash = ''; }}
              className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto' }}
            >
              <LayoutDashboard size={16} /> {isSuperAdmin ? 'Panel Admin' : 'Mi Panel'}
            </button>

            <button
              onClick={() => { setActiveTab('checkin'); window.location.hash = `#/checkin/${getSlugFromHash()}`; }}
              className={activeTab === 'checkin' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto', borderColor: activeTab === 'checkin' ? undefined : 'rgba(16, 185, 129, 0.4)' }}
            >
              <UserCheck size={16} color="#34d399" /> Check-in NFC
            </button>

            <button
              onClick={() => { setActiveTab('nfc-qr'); window.location.hash = ''; }}
              className={activeTab === 'nfc-qr' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto' }}
            >
              <QrCode size={16} /> Mi QR y NFC
            </button>

            <button
              onClick={() => { setActiveTab('settings'); window.location.hash = ''; }}
              className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto' }}
            >
              <Building size={16} /> Mi Local
            </button>

            <button
              onClick={() => { setActiveTab('support'); window.location.hash = ''; }}
              className={activeTab === 'support' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap', width: 'auto' }}
            >
              <Headphones size={16} color="#10b981" /> Soporte
            </button>
          </nav>

          {/* Auth Button */}
          <div style={{ flexShrink: 0 }}>
            {token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: isSuperAdmin ? '#fbbf24' : 'var(--text-muted)', fontWeight: isSuperAdmin ? 700 : 500, whiteSpace: 'nowrap' }}>
                  👤 {user?.name || 'Administrador'}
                </span>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap', width: 'auto' }}>
                  <LogOut size={14} /> Salir
                </button>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.88rem', whiteSpace: 'nowrap', width: 'auto' }}>
                <LogIn size={16} /> Ingresar
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.5rem 1rem' }}>

        {activeTab === 'dashboard' && (
          isSuperAdmin ? (
            <SuperAdminDashboard
              token={token}
              onSelectVenueForNfc={() => setActiveTab('nfc-qr')}
            />
          ) : (
            <Dashboard
              token={token}
              venueId={currentVenue?.id}
              onNavigateToNfc={() => setActiveTab('nfc-qr')}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )
        )}

        {activeTab === 'checkin' && (
          <PublicCheckIn venueSlug={getSlugFromHash()} />
        )}

        {activeTab === 'nfc-qr' && (
          <NfcQrGenerator
            venue={currentVenue || { name: 'Café Gourmet Central', slug: 'cafe-gourmet-central', geofence_radius: 75 }}
            user={user}
            onOpenCheckinView={() => { setActiveTab('checkin'); window.location.hash = `#/checkin/${getSlugFromHash()}`; }}
          />
        )}

        {activeTab === 'settings' && (
          <VenueSettings
            token={token}
            venue={currentVenue}
            venues={venues}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSelectVenue={(v) => setCurrentVenue(v)}
            onVenueUpdated={(v) => {
              setCurrentVenue(v);
              if (token) {
                fetch(`${API_BASE_URL}/api/venues`, { headers: { Authorization: `Bearer ${token}` } })
                  .then(r => r.json())
                  .then(data => setVenues(data));
              }
            }}
          />
        )}

        {activeTab === 'support' && (
          <SupportSection />
        )}

      </main>

      {/* Footer */}
      <footer className="glass-card" style={{ borderRadius: 0, borderBottom: 0, borderLeft: 0, borderRight: 0, padding: '1.1rem 1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 22, height: 22, borderRadius: '7px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={13} color="#fff" />
            </div>
            <span><strong style={{ color: '#a5b4fc' }}>LocalPass</strong> · Registro inteligente de clientes para tu local · © 2026</span>
          </div>
          <div>
            Soporte: <a href="tel:3183763021" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>318 376 3021</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
