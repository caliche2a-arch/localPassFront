import React, { useState, useEffect } from 'react';
import { Crown, DollarSign, Users, Building, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Smartphone, Search, Save } from 'lucide-react';
import { API_BASE_URL } from '../config';

export function SuperAdminDashboard({ token, onSelectVenueForNfc }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [editingAmount, setEditingAmount] = useState({});

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!statsRes.ok || !usersRes.ok) throw new Error('Error al cargar panel de administración');

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData);
      setUsers(usersData);

      const initialAmounts = {};
      usersData.forEach(u => {
        initialAmounts[u.id] = u.amount_paid || 0;
      });
      setEditingAmount(initialAmounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserPayment = async (user) => {
    const newIsPaid = user.is_paid === 1 ? 0 : 1;
    setUpdatingId(user.id);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_paid: newIsPaid })
      });

      if (!res.ok) throw new Error('Error actualizando pago');
      
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_paid: newIsPaid } : u));
      fetchAdminData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const saveUserPlanAndAmount = async (user) => {
    setUpdatingId(user.id);
    const amount = Number(editingAmount[user.id]) || 0;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_type: user.plan_type,
          amount_paid: amount
        })
      });

      if (!res.ok) throw new Error('Error actualizando usuario');
      
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, amount_paid: amount } : u));
      fetchAdminData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" color="#6366f1" style={{ margin: '0 auto 1rem' }} />
        <p className="gradient-text">Cargando Panel de Administración...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '6px' }}>
            <Crown size={14} /> Panel Administrador
          </span>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            Directorio de Negocios & Control de Licencias
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Administra las suscripciones de los dueños de locales, registra los valores de planes y gestiona los accesos a la plataforma.
          </p>
        </div>
      </div>

      {/* Admin Financial Stats Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          
          <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Recaudado ($)</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>
              ${stats.total_revenue.toLocaleString()}
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cobros registrados</span>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Clientes / Negocios</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0' }}>{stats.total_clients}</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dueños de locales activos</span>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Clientes Habilitados</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>{stats.paid_clients}</h2>
            <span style={{ fontSize: '0.72rem', color: '#34d399' }}>Acceso activo</span>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Clientes Suspendidos</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', margin: '4px 0' }}>{stats.unpaid_clients}</h2>
            <span style={{ fontSize: '0.72rem', color: '#f87171' }}>Bloqueados por pago</span>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Visitas Totales Plataforma</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a5b4fc', margin: '4px 0' }}>{stats.total_visits}</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Idas registradas</span>
          </div>

        </div>
      )}

      {/* Main Table: Clients & Payment Management */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Directorio de Usuarios y Registro de Cobros</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Habilita o suspende el acceso a la plataforma y registra los montos cobrados.
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Buscar por negocio o correo..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            />
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 12 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Cliente / Negocio</th>
                <th style={{ padding: '10px' }}>Correo de Login</th>
                <th style={{ padding: '10px' }}>Sedes</th>
                <th style={{ padding: '10px' }}>Tipo de Plan</th>
                <th style={{ padding: '10px' }}>Monto Pagado ($)</th>
                <th style={{ padding: '10px' }}>Estado de Acceso</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                    {u.name} {u.role === 'admin' && <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>Admin</span>}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span className="badge badge-purple">{u.venues_count} sedes</span>
                  </td>
                  
                  {/* Plan Type Selector */}
                  <td style={{ padding: '12px 10px' }}>
                    {u.role === 'admin' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Plataforma</span>
                    ) : (
                      <select
                        value={u.plan_type}
                        onChange={(e) => {
                          const newPlan = e.target.value;
                          setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, plan_type: newPlan } : usr));
                        }}
                        className="input-field"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="basico">Plan Básico</option>
                        <option value="pro">Plan Pro</option>
                        <option value="premium">Plan Premium</option>
                      </select>
                    )}
                  </td>

                  {/* Amount Paid Input */}
                  <td style={{ padding: '12px 10px' }}>
                    {u.role === 'admin' ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>$</span>
                        <input
                          type="number"
                          className="input-field"
                          value={editingAmount[u.id] !== undefined ? editingAmount[u.id] : u.amount_paid || 0}
                          onChange={(e) => setEditingAmount({ ...editingAmount, [u.id]: e.target.value })}
                          style={{ width: '90px', padding: '4px 8px', fontSize: '0.82rem' }}
                        />
                        <button
                          onClick={() => saveUserPlanAndAmount(u)}
                          disabled={updatingId === u.id}
                          className="btn-secondary"
                          title="Guardar Plan y Monto"
                          style={{ padding: '4px 8px' }}
                        >
                          <Save size={14} color="#34d399" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Payment Status Badge */}
                  <td style={{ padding: '12px 10px' }}>
                    {u.role === 'admin' ? (
                      <span className="badge badge-green">Activo</span>
                    ) : u.is_paid === 1 ? (
                      <span className="badge badge-green">
                        <CheckCircle2 size={12} /> Habilitado
                      </span>
                    ) : (
                      <span className="badge badge-red">
                        <XCircle size={12} /> Suspendido
                      </span>
                    )}
                  </td>

                  {/* Action Toggle Button */}
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggleUserPayment(u)}
                        disabled={updatingId === u.id}
                        className={u.is_paid === 1 ? 'btn-secondary' : 'btn-primary'}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: u.is_paid === 1 ? '#ef4444' : undefined }}
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

    </div>
  );
}
