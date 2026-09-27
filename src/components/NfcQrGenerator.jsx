import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, QrCode, Copy, ExternalLink, Printer, Check, ShieldCheck, Phone, Wrench, Crown } from 'lucide-react';

export function NfcQrGenerator({ venue, user, onOpenCheckinView }) {
  const [copied, setCopied] = useState(false);

  // Check if current logged in user is Carlos / Super Admin
  const isSuperAdmin = user && (user.email === 'admin@localpass.com' || user.role === 'admin' || user.role === 'superadmin');

  if (!venue) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: 500, margin: '2rem auto' }}>
        <p>Selecciona un local para ver su QR y tarjetas de mesas.</p>
      </div>
    );
  }

  // Construct full checkin URL
  const publicUrl = `${window.location.origin}/#/checkin/${venue.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badge-purple"><Smartphone size={14} /> Tarjetas & NFC Mesas</span>
          <span className="badge badge-green"><ShieldCheck size={14} /> Geocerca de {venue.geofence_radius}m</span>
          {isSuperAdmin && (
            <span className="badge badge-purple"><Crown size={14} /> Administrador</span>
          )}
        </div>

        <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          Código QR y Enlace para Mesas
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0.5rem auto 1.5rem auto' }}>
          Imprime este código QR para colocar en las mesas de <strong>{venue.name}</strong>.
        </p>

        {/* Printable Card Area */}
        <div 
          className="printable-card"
          style={{ 
            background: '#ffffff', 
            color: '#111827', 
            borderRadius: '20px', 
            padding: '2.5rem 1.5rem', 
            maxWidth: '360px', 
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '4px solid #6366f1'
          }}
        >
          <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', letterSpacing: '1px', marginBottom: '0.25rem' }}>
            REGISTRA TU VISITA
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
            {venue.name}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '1.25rem' }}>
            Acerca tu celular al sticker NFC o escanea el código QR
          </p>

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '16px', display: 'inline-block', border: '1px solid #e5e7eb' }}>
            <QRCodeSVG value={publicUrl} size={180} level="H" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
            <Smartphone size={16} color="#6366f1" /> Pasa tu Celular sobre la mesa
          </div>
        </div>

        {/* URL Link Action */}
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <label className="input-label" style={{ textAlign: 'left' }}>Enlace Directo del Local:</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="input-field"
              style={{ fontSize: '0.85rem' }}
            />
            <button onClick={handleCopy} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={handlePrint} className="btn-secondary">
              <Printer size={16} /> Imprimir Tarjeta QR
            </button>
            <button onClick={onOpenCheckinView} className="btn-primary" style={{ padding: '10px' }}>
              <ExternalLink size={16} /> Probar Vista Cliente
            </button>
          </div>
        </div>

      </div>

      {/* NFC Ordering Info for Regular Venue Owners */}
      {!isSuperAdmin && (
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#34d399', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={20} color="#10b981" /> ¿Deseas Stickers NFC Físicos para tus Mesas?
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1rem' }}>
            Las etiquetas NFC físicas para las mesas son codificadas y entregadas directamente por el administrador del sistema. Recíbelas listas para colocar en tu negocio contactando a soporte:
          </p>

          <a
            href={`https://wa.me/573183763021?text=Hola,%20quisiera%20solicitar%20etiquetas%20NFC%20f%C3%ADsicas%20para%20mi%20local%20${encodeURIComponent(venue.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-whatsapp"
            style={{ textDecoration: 'none', display: 'inline-flex', padding: '10px 20px', width: 'auto', fontSize: '0.9rem' }}
          >
            <Phone size={16} /> Solicitar Stickers NFC Físicos (WhatsApp 3183763021)
          </a>
        </div>
      )}

      {/* Admin Tag Burner Payload (ONLY for Super Admin) */}
      {isSuperAdmin && (
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
          <h4 style={{ fontSize: '1rem', color: '#a5b4fc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={16} /> Payload de Grabación de Chips NFC (NTAG215/216)
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Copia esta URL en tu aplicación NFC Tools para grabar la etiqueta de este local:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px 14px', borderRadius: 10, fontFamily: 'monospace', fontSize: '0.85rem', color: '#67e8f9', wordBreak: 'break-all' }}>
            {publicUrl}
          </div>
        </div>
      )}

    </div>
  );
}
