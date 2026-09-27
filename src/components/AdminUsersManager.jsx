import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export function AdminUsersManager({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar lista de usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserPayment = async (userId, currentIsPaid) => {
    const newIsPaid = currentIsPaid === 1 ? 0 : 1;
    setUpdatingId(userId);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_paid: newIsPaid })
      });

      if (!res.ok) throw new Error('Error al actualizar estado');
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_paid: newIsPaid } : u));
    } catch (err) {
      alert('No se pudo actualizar el pago: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const updatePlanType = async (userId, newPlan) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan_type: newPlan })
      });

      if (!res.ok) throw new Error('Error al actualizar plan');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan_type: newPlan } : u));
    } catch (err) {
      alert('Error actualizando plan: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <RefreshCw size={24} className="spin" color="#6366f1" style={{ margin: '0 auto 0.5rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando directorio de usuarios...</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown size={20} color="#6366f1" /> Directorio de Usuarios y Licencias
        </h3>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px' }}>Usuario / Negocio</th>
              <th style={{ padding: '8px' }}>Correo</th>
              <th style={{ padding: '8px' }}>Sedes</th>
              <th style={{ padding: '8px' }}>Tipo de Plan</th>
              <th style={{ padding: '8px' }}>Estado de Acceso</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                  {u.name} {u.role === 'admin' && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Admin</span>}
                </td>
                <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{u.email}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span className="badge badge-purple">{u.venues_count} sedes</span>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <select
                    value={u.plan_type}
                    onChange={(e) => updatePlanType(u.id, e.target.value)}
                    disabled={updatingId === u.id || u.role === 'admin'}
                    className="input-field"
                    style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                  >
                    <option value="basico">Plan Básico</option>
                    <option value="pro">Plan Pro</option>
                    <option value="premium">Plan Premium</option>
                  </select>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  {u.is_paid === 1 ? (
                    <span className="badge badge-green">
                      <CheckCircle2 size={12} /> Habilitado
                    </span>
                  ) : (
                    <span className="badge badge-red">
                      <XCircle size={12} /> Suspendido
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleUserPayment(u.id, u.is_paid)}
                      disabled={updatingId === u.id}
                      className={u.is_paid === 1 ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '5px 10px', fontSize: '0.75rem', borderColor: u.is_paid === 1 ? '#ef4444' : undefined }}
                    >
                      {updatingId === u.id ? '...' : u.is_paid === 1 ? '⛔ Bloquear Acceso' : '✅ Habilitar Acceso'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
