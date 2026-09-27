import React, { useState } from 'react';
import { User, Lock, Mail, LogIn, UserPlus, X, Sparkles, KeyRound, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentBlocked(false);
    setSuccessMessage(null);

    if (mode === 'forgot') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, new_password: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al reestablecer la contraseña');
        setSuccessMessage(data.message);
        setTimeout(() => setMode('login'), 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = mode === 'register' ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
    const payload = mode === 'register' ? { name, email, password, plan_type: 'basico' } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.is_paid_blocked) {
          setPaymentBlocked(true);
          setError(data.message);
        } else {
          throw new Error(data.error || 'Error de autenticación');
        }
      } else {
        onLoginSuccess(data.token, data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', position: 'relative' }}>
        
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }} className="gradient-text">
            {mode === 'register' ? 'Crear Cuenta de Local' : mode === 'forgot' ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'register' ? 'Plan Básico de Plataforma y Gestión de Visitas' : mode === 'forgot' ? 'Ingresa tu correo y nueva contraseña' : 'Accede al panel de control de tu local'}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> {successMessage}
          </div>
        )}

        {/* Payment Blocked Warning Alert */}
        {paymentBlocked ? (
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.1)' }}>
            <AlertTriangle size={32} color="#fbbf24" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ color: '#fbbf24', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
              Cuenta Inactiva por Pago Pendiente
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1rem' }}>
              {error}
            </p>
            <a
              href="https://wa.me/573183763021?text=Hola,%20quisiera%20renovar%20el%20pago%20de%20mi%20cuenta%20en%20LocalPass%20NFC"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-whatsapp"
              style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 16px', fontSize: '0.85rem' }}
            >
              <Phone size={14} /> Renovar en WhatsApp (3183763021)
            </a>
          </div>
        ) : error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        {!paymentBlocked && (
          <form onSubmit={handleSubmit}>

            {mode === 'register' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Nombre del Negocio o Administrador</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Café El Poblado"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <User size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">
                {mode === 'forgot' ? 'Nueva Contraseña' : 'Contraseña'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock size={16} color="#9ca3af" style={{ position: 'absolute', right: 14, top: 14 }} />
              </div>
            </div>

            {/* Forgot password link for Login mode */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginBottom: '1rem' }}>
              {loading ? (
                'Procesando...'
              ) : mode === 'register' ? (
                <><UserPlus size={18} /> Crear Cuenta (Plan Básico)</>
              ) : mode === 'forgot' ? (
                <><KeyRound size={18} /> Reestablecer Contraseña</>
              ) : (
                <><LogIn size={18} /> Entrar al Panel</>
              )}
            </button>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mode !== 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setPaymentBlocked(false); }}
                  style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Volver a Iniciar Sesión
                </button>
              )}
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); setPaymentBlocked(false); }}
                  style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ¿No tienes cuenta? Regístrate en Plan Básico
                </button>
              )}
            </div>

          </form>
        )}

      </div>

    </div>
  );
}
