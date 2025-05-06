import { useEffect, useRef, useState } from 'react';

const MapaAviones = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersMap = useRef(new Map()); // hex -> marker
  const planeIconRef = useRef(null);
  const avionImagenUrl = new URL('../assets/avion.svg', import.meta.url).href;
  const [pais, setPais] = useState('Spain'); // Estado para el país seleccionado

  const obtenerAviones = async () => {
    const apiEndpoint = pais === 'Europa' ? 'Europa' : pais; // Mapeo de valores
    try {
      const response = await fetch(`/api/${apiEndpoint}Planes`); // URL dinámica según el país seleccionado
      const data = await response.json();
      return data.avionesInfo || [];
    } catch (error) {
      console.error('Error al obtener los aviones:', error);
      return [];
    }
  };

  const updateMarkers = (aviones) => {
    const nuevosHex = new Set(aviones.map((av) => av.hex));

    // Eliminar marcadores que ya no existen
    for (const [hex, marker] of markersMap.current.entries()) {
      if (!nuevosHex.has(hex)) {
        marker.remove();
        markersMap.current.delete(hex);
      }
    }

    // Crear o actualizar marcadores
    aviones.forEach((avion) => {
      const { hex, lat, lon, track } = avion;

      if (markersMap.current.has(hex)) {
        // Actualizar posición y rotación
        const marker = markersMap.current.get(hex);
        marker.setLatLng([lat, lon]);
        marker.setRotationAngle(track || 0);
      } else {
        // Crear nuevo marcador con rotación
        const marker = L.marker([lat, lon], {
          icon: planeIconRef.current,
          rotationAngle: track || 0,
          rotationOrigin: 'center center',
        }).addTo(mapInstance.current);

        marker.bindPopup(`
          <b>Hex:</b> ${hex}<br/>
          <b>Velocidad:</b> ${avion.gs} kt<br/>
          <b>Altitud:</b> ${avion.alt_baro} ft<br/>
          <b>Rumbo:</b> ${track || 'N/A'}°
        `);

        markersMap.current.set(hex, marker);
      }
    });
  };

  useEffect(() => {
    let intervalId;

    const initMap = async () => {
      await import('leaflet/dist/leaflet.css');
      const L = await import('leaflet');
      await import('leaflet-rotatedmarker'); // Importación del plugin

      if (!mapRef.current || mapInstance.current) return;

      // Icono definido una sola vez
      planeIconRef.current = L.icon({
        iconUrl: avionImagenUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const map = L.map(mapRef.current).setView([40.4168, -3.7038], 6);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Carga inicial
      const aviones = await obtenerAviones();
      updateMarkers(aviones);

      // Actualizar cada 3 segundos
      intervalId = setInterval(async () => {
        const nuevosAviones = await obtenerAviones();
        updateMarkers(nuevosAviones);
      }, 3000);
    };

    if (!mapInstance.current) {
      initMap();
    } else {
      // Si el mapa ya está inicializado, solo actualizamos los marcadores
      (async () => {
        const aviones = await obtenerAviones();
        updateMarkers(aviones);
      })();
    }

    return () => {
      // Limpiar el intervalo al desmontar o cambiar el país
      if (intervalId) clearInterval(intervalId);
    };
  }, [pais]); // Dependencia en el país seleccionado

  return (
    <>
      <select value={pais} onChange={(e) => setPais(e.target.value)}>
        <option value="Spain">Españistán</option>
        <option value="Europa">Europe</option>
      </select>
      <div ref={mapRef} style={{ height: '100vh', width: '100%' }}></div>
    </>
  );
};

export default MapaAviones;