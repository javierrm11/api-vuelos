import { useEffect, useRef, useState } from 'react';

const MapaAviones = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersMap = useRef(new Map());
  const [pais, setPais] = useState('Spain');
  const [avionesVisibles, setAvionesVisibles] = useState([]);
  const [radio, setRadio] = useState(100); // en km
  const [avionesCerca, setAvionesCerca] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const userCircle = useRef(null);

  const obtenerAviones = async () => {
    try {
      if (pais === "Global") {
        const regiones = ["Europa", "America", "Asia", "Africa", "Oceania"];
        const resultados = await Promise.all(
          regiones.map(async (region) => {
            const response = await fetch(`/api/planes?region=${region}`);
            const data = await response.json();
            if (data.error) return [];
            return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
          })
        );
        return resultados.flat();
      } else {
        const response = await fetch(`/api/planes?region=${pais}`);
        const data = await response.json();

        if (data.error) {
          console.error(`Error al obtener aviones para ${pais}:`, data.error);
          return [];
        }

        return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
      }
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
      const { hex, lat, lon, t, flight, pais, track, alt_baro, gs } = avion;
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
          <div class="p-2 bg-white rounded shadow-md text-sm">
            <div class="flex items-center mb-2">
              <b class="mr-2">País:</b> 
              <img src="./paises/${avion.pais}.png" alt="bandera" class="w-4 h-4 inline-block mr-1" />
            </div>
            <div><b>Hex:</b> ${hex}</div>
            <div><b>Vuelo:</b> ${flight || 'N/A'}</div>
            <div><b>Tipo:</b> ${t || 'N/A'}</div>
            <div><b>Velocidad:</b> ${gs} kt</div>
            <div><b>Altitud:</b> ${alt_baro} ft</div>
            <div><b>Rumbo:</b> ${track || 'N/A'}°</div>
          </div>
        `);

        markersMap.current.set(hex, marker);
      }
    });

    setAvionesVisibles(aviones.sort((a, b) => (b.gs || 0) - (a.gs || 0)));
  };

  const distancia = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const marcarRadio = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPos([latitude, longitude]);
        mapInstance.current.setView([latitude, longitude], 8);
        // El círculo y el recuento se actualizan automáticamente por el useEffect
      },
      (error) => {
        alert('No se pudo obtener tu ubicación');
      }
    );
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

      // Mostrar ubicación del usuario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            map.setView([latitude, longitude], 8);

            const userMarker = L.circleMarker([latitude, longitude], {
              radius: 8,
              fillColor: "#3388ff",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8,
            }).addTo(map);

            userMarker.bindPopup('Tu ubicación').openPopup();

            // Guarda tu ubicación en el estado para el círculo y el recuento
            setUserPos([latitude, longitude]);
          },
          (error) => {
            console.warn("Error obteniendo ubicación:", error.message);
          }
        );
      } else {
        console.warn("Geolocalización no soportada por este navegador.");
      }

      // Leyenda
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
  
  useEffect(() => {
    if (!mapInstance.current || !userPos) return;

    // Elimina el círculo anterior si existe
    if (userCircle.current) {
      userCircle.current.remove();
    }

    // Dibuja el círculo en la posición seleccionada
    const L = window.L || mapInstance.current._leaflet;
    userCircle.current = L.circle(userPos, {
      radius: radio * 1000,
      color: '#3388ff',
      fillColor: '#3388ff',
      fillOpacity: 0.2,
    }).addTo(mapInstance.current);

    // Cuenta los aviones dentro del radio
    let cuenta = 0;
    avionesVisibles.forEach((avion) => {
      if (
        avion.lat &&
        avion.lon &&
        distancia(userPos[0], userPos[1], avion.lat, avion.lon) <= radio
      ) {
        cuenta++;
      }
    });
    setAvionesCerca(cuenta);
  }, [avionesVisibles, radio, userPos]);

  return (
    <div style={{ display: 'flex' }}>
      <aside
        style={{
          width: '300px',
          height: '99vh',
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #ddd',
          resize: 'horizontal',
          minWidth: '150px',
          maxWidth: '500px',
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
                <td><img src={`./paises/${avion.pais}.png`} alt="bandera" style={{ width: '20px', height: '20px' }} /></td>
                <td>{avion.hex}</td>
                <td>{avion.alt_baro || 'N/A'}</td>
                <td>{avion.gs || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '1rem' }}>
          <label>
            Radio (km):{' '}
            <input
              type="number"
              min="1"
              value={radio}
              onChange={(e) => setRadio(Number(e.target.value))}
              style={{ width: '60px' }}
            />
          </label>
          <button onClick={marcarRadio} style={{ marginLeft: '8px' }}>
            Marcar radio
          </button>
          {userPos && (
            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
              Hay {avionesCerca} aviones cerca de ti
            </div>
          )}
        </div>
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
        </select>
        <div ref={mapRef} style={{ height: '95vh', width: '100%', zIndex: 1 }}></div>
      </div>
    </div>
  );
};

export default MapaAviones;