import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tile provider options (All 100% FREE - ZERO API KEYS NEEDED)
const MAP_STYLES = {
  osm: {
    name: '🗺️ Estándar',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; Colaboradores del mapa'
  },
  voyager: {
    name: '🎨 Callejero',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Datos cartográficos'
  }
};

// Custom Glowing Neon SVG Marker Icon
const customNeonIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -100%);
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.4);
        box-shadow: 0 0 20px #6366f1, 0 0 35px #ec4899;
        animation: radar-pulse 2s infinite ease-in-out;
      "></div>
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #ec4899);
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

export function MapPicker({ latitude, longitude, radius, onChangeLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [mapStyleKey, setMapStyleKey] = useState('osm');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = Number(latitude) || 6.2442;
    const initialLng = Number(longitude) || -75.5812;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true
      });

      // Default OpenStreetMap tile layer
      const styleConfig = MAP_STYLES[mapStyleKey];
      const tileLayer = L.tileLayer(styleConfig.url, {
        attribution: styleConfig.attribution,
        maxZoom: 19
      }).addTo(map);

      // Neon Marker
      const marker = L.marker([initialLat, initialLng], {
        icon: customNeonIcon,
        draggable: true
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; text-align: center; color: #111;">
          <strong style="color: #6366f1; font-size: 1rem;">📍 Ubicación del Local</strong><br>
          <span style="font-size: 0.8rem; color: #666;">Arrastra este pin o haz clic en el mapa</span>
        </div>
      `).openPopup();

      // Geofence Circle
      const circle = L.circle([initialLat, initialLng], {
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '6, 6',
        radius: Number(radius) || 50
      }).addTo(map);

      // Marker drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        onChangeLocation(pos.lat, pos.lng);
      });

      // Map click event
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        onChangeLocation(lat, lng);
      });

      // Invalidate size after mount to ensure perfect rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 300);

      mapRef.current = map;
      tileLayerRef.current = tileLayer;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map style tiles
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const styleConfig = MAP_STYLES[mapStyleKey];
    tileLayerRef.current.setUrl(styleConfig.url);
  }, [mapStyleKey]);

  // Update marker position & circle radius when props change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;

    const lat = Number(latitude) || 6.2442;
    const lng = Number(longitude) || -75.5812;
    const rad = Number(radius) || 50;

    const currentMarkerLatLng = markerRef.current.getLatLng();
    if (Math.abs(currentMarkerLatLng.lat - lat) > 0.00001 || Math.abs(currentMarkerLatLng.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }

    circleRef.current.setLatLng([lat, lng]);
    circleRef.current.setRadius(rad);
  }, [latitude, longitude, radius]);

  // Search Address via Geocoding API
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    if (mapRef.current && markerRef.current && circleRef.current) {
      mapRef.current.setView([lat, lng], 17);
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      onChangeLocation(lat, lng);
    }

    setSearchResults([]);
    setSearchQuery(item.display_name.split(',')[0]);
  };

  return (
    <div style={{ width: '100%', marginBottom: '1.25rem' }}>
      
      {/* Top Map Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        
        {/* Style Selector */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {Object.keys(MAP_STYLES).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapStyleKey(key)}
              className={mapStyleKey === key ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              {MAP_STYLES[key].name}
            </button>
          ))}
        </div>


      </div>

      {/* Search Input for Address */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <form onSubmit={handleSearchAddress} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Buscar dirección, centro comercial o ciudad (Ej: El Poblado, Medellín)..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-secondary" disabled={isSearching} style={{ whiteSpace: 'nowrap', padding: '0 16px' }}>
            {isSearching ? 'Buscando...' : '🔍 Buscar'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="glass-card" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px'
          }}>
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => selectSearchResult(item)}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                📍 {item.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '350px',
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          overflow: 'hidden',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
          zIndex: 1
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>💡 Arrastra el marcador neón para fijar la ubicación del local.</span>
        <span>Geocerca: <strong style={{ color: '#6366f1' }}>{radius}m</strong> de radio</span>
      </div>
    </div>
  );
}
