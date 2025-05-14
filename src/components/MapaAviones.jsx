import { useEffect, useRef, useState } from 'react';

const MapaAviones = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersMap = useRef(new Map()); // hex -> marker
  const [pais, setPais] = useState('Spain');
  const [avionesVisibles, setAvionesVisibles] = useState([]);

  const obtenerAviones = async () => {
    try {
      const response = await fetch(`/api/planes?region=${pais}`);
      const data = await response.json();

      if (data.error) {
        console.error(`Error al obtener aviones para ${pais}:`, data.error);
        return [];
      }

      return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
    } catch (error) {
      console.error(`Error al realizar la solicitud para ${pais}:`, error);
      return [];
    }
  };

  const generarIconoPorAltitud = (alt_baro) => {
    let color = '#00cc44';

    if (alt_baro <= 10000) {
      color = '#ff0000';
    } else if (alt_baro > 10000 && alt_baro <= 30000) {
      color = '#ffaa00';
    }

    const svgHTML = `
      <svg width="32" height="32" viewBox="-0.8 -0.8 17.60 17.60" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0L6 2V5L0 9V11H1L6 10L7 13L5 14V16H11V14L9 13L10 10L15 11H16V9L10 5V2L9 0H7Z" fill="${color}" stroke="black" stroke-width="0.5"/>
      </svg>
    `;

    return L.divIcon({
      html: svgHTML,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const updateMarkers = (aviones) => {
    const nuevosHex = new Set(aviones.map((av) => av.hex));

    for (const [hex, marker] of markersMap.current.entries()) {
      if (!nuevosHex.has(hex)) {
        marker.remove();
        markersMap.current.delete(hex);
      }
    }

    aviones.forEach((avion) => {
      const { hex, lat, lon, track, alt_baro, gs } = avion;
      const iconoDinamico = generarIconoPorAltitud(alt_baro || 0);

      if (markersMap.current.has(hex)) {
        const marker = markersMap.current.get(hex);
        marker.setLatLng([lat, lon]);
        marker.setRotationAngle(track || 0);
        marker.setIcon(iconoDinamico);
      } else {
        const marker = L.marker([lat, lon], {
          icon: iconoDinamico,
          rotationAngle: track || 0,
          rotationOrigin: 'center center',
        }).addTo(mapInstance.current);

        marker.bindPopup(`
          <b>Hex:</b> ${hex}<br/>
          <b>Velocidad:</b> ${gs} kt<br/>
          <b>Altitud:</b> ${alt_baro} ft<br/>
          <b>Rumbo:</b> ${track || 'N/A'}°
        `);

        markersMap.current.set(hex, marker);
      }
    });

    setAvionesVisibles(aviones.sort((a, b) => (b.gs || 0) - (a.gs || 0)));
  };

  useEffect(() => {
    let intervalId;

    const initMap = async () => {
      await import('leaflet/dist/leaflet.css');
      const L = await import('leaflet');
      await import('leaflet-rotatedmarker');

      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current).setView([40.4168, -3.7038], 6);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const legend = L.control({ position: 'topright' });

      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML += `
          <h4 style="margin-top: 0; margin-bottom: 4px;">Altitud</h4>
          <i style="background:#ff0000;width:12px;height:12px;display:inline-block;margin-right:4px;"></i> ≤ 10.000 ft<br/>
          <i style="background:#ffaa00;width:12px;height:12px;display:inline-block;margin-right:4px;"></i> 10.001 - 30.000 ft<br/>
          <i style="background:#00cc44;width:12px;height:12px;display:inline-block;margin-right:4px;"></i> > 30.000 ft
        `;
        div.style.backgroundColor = 'white';
        div.style.padding = '8px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        div.style.fontSize = '14px';
        return div;
      };

      legend.addTo(map);
    };

    const startFetching = async () => {
      const aviones = await obtenerAviones();
      updateMarkers(aviones);

      intervalId = setInterval(async () => {
        const nuevosAviones = await obtenerAviones();
        updateMarkers(nuevosAviones);
      }, 10000);
    };

    if (!mapInstance.current) {
      initMap().then(startFetching);
    } else {
      startFetching();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pais]);

  return (
    <div style={{ display: 'flex' }}>
      <aside
        style={{
          width: '300px',
          height: '99vh',
          overflowX: 'auto', // Scroll horizontal
          overflowY: 'auto', // Scroll vertical
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #ddd',
          resize: 'horizontal', // Permitir redimensionar horizontalmente
          minWidth: '150px', // Ancho mínimo
          maxWidth: '500px', // Ancho máximo
        }}
      >
        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc' }}>País</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Hex</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Altitud</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Vel. (kt)</th>
            </tr>
          </thead>
          <tbody>
            {avionesVisibles.map((avion) => (
              <tr key={avion.hex}>
                <td>{avion.pais}</td>
                <td>{avion.hex}</td>
                <td>{avion.alt_baro || 'N/A'}</td>
                <td>{avion.gs || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>

      <div style={{ flex: 1 }}>
        <select
          value={pais}
          onChange={(e) => setPais(e.target.value)}
        >
          <option value="Spain">España</option>
          <option value="Europa">Europe</option>
          <option value="Africa">Africa</option>
          <option value="Asia">Asia</option>
          <option value="America">America</option>
          <option value="Oceania">Oceania</option>
          <option value="Global">Global</option>
        </select>
        <div ref={mapRef} style={{ height: '95vh', width: '100%', zIndex: 1 }}></div>
      </div>
    </div>
  );
};

export default MapaAviones;