import React from 'react';
import { Phone, MessageSquare, Headphones, HelpCircle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export function SupportSection() {
  const supportPhone = "3183763021";
  const whatsappUrl = `https://wa.me/573183763021?text=Hola%20Carlos,%20necesito%20ayuda%20con%20la%20app%20de%20Registro%20de%20Locales%20y%20NFC`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Support Header */}
      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' }}>
          <Headphones size={32} color="#ffffff" />
        </div>

        <span className="badge badge-green" style={{ marginBottom: '0.75rem' }}>
          <Sparkles size={12} /> Soporte Directo Activo
        </span>

        <h1 className="gradient-text-green" style={{ fontSize: '2rem', fontWeight: 800 }}>
          Centro de Soporte y Atención
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '540px', margin: '0.5rem auto 1.5rem auto' }}>
          ¿Tienes dudas con la geolocalización, necesitas pedir etiquetas NFC físicas para tus mesas o ayuda con tu local?
        </p>

        {/* Contact Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card glass-card-interactive btn-whatsapp"
            style={{ padding: '1.5rem', textDecoration: 'none', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <MessageSquare size={28} />
            <strong style={{ fontSize: '1.1rem' }}>WhatsApp Directo</strong>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>+57 318 376 3021</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '10px' }}>Respuesta Rápida</span>
          </a>

          <a
            href={`tel:${supportPhone}`}
            className="glass-card glass-card-interactive"
            style={{ padding: '1.5rem', textDecoration: 'none', color: '#ffffff', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: '1px solid rgba(99, 102, 241, 0.4)' }}
          >
            <Phone size={28} color="#6366f1" />
            <strong style={{ fontSize: '1.1rem' }}>Llamada de Soporte</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{supportPhone}</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '3px 10px', borderRadius: '10px' }}>Línea Directa</span>
          </a>

        </div>
      </div>

      {/* FAQ Guide */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} color="#6366f1" /> Preguntas Frecuentes
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <strong style={{ fontSize: '0.95rem', color: '#f3f4f6', display: 'block', marginBottom: '4px' }}>
              🔒 ¿Cómo funciona la seguridad si el cliente guarda la URL?
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              El sistema utiliza la fórmula matemática de Haversine para calcular la distancia en metros entre la coordenada GPS del celular del cliente y la coordenada de tu local. Si el cliente intenta registrar su visita fuera del rango (ej. a más de 50m), el sistema bloquea la entrada.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <strong style={{ fontSize: '0.95rem', color: '#f3f4f6', display: 'block', marginBottom: '4px' }}>
              📲 ¿Cómo solicito los stickers NFC para las mesas de mi local?
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Puedes solicitar las etiquetas NFC físicas grabadas llamando o escribiendo por WhatsApp al <strong>3183763021</strong>. Nuestro equipo se encarga de enviarte los stickers codificados y listos para usar en tu establecimiento.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <strong style={{ fontSize: '0.95rem', color: '#f3f4f6', display: 'block', marginBottom: '4px' }}>
              🖨️ ¿Puedo usar el código QR mientras llegan los stickers NFC?
            </strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              ¡Sí, totalmente! Puedes descargar e imprimir la tarjeta QR desde el menú <strong>Tarjeta QR & NFC</strong> y pegarla en las mesas. Funciona con el mismo nivel de seguridad GPS que las etiquetas NFC.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
