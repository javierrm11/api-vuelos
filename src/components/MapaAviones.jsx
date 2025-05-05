import { useEffect, useRef, useState } from 'react';

const MapaAviones = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const [avionesInfo, setAvionesInfo] = useState([]);

  const obtenerAviones = async () => {
    const response = await fetch('/api/SpainPlanes');
    const data = await response.json();
    return data.avionesInfo || [];
  };

  const updateMarkers = (aviones) => {
    // Eliminar los marcadores antiguos
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Crear nuevos marcadores
    aviones.forEach(avion => {
      const marker = L.marker([avion.lat, avion.lon]).addTo(mapInstance.current);
      marker.bindPopup(`
        <b>Hex:</b> ${avion.hex}<br/>
        <b>Velocidad:</b> ${avion.gs} kt<br/>
        <b>Altitud:</b> ${avion.alt_baro} ft
      `);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    const initMap = async () => {
      await import('leaflet/dist/leaflet.css');
      const L = await import('leaflet');

      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current).setView([40.4168, -3.7038], 6);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Obtener los aviones inicialmente y dibujar los marcadores
      const aviones = await obtenerAviones();
      setAvionesInfo(aviones);  // Actualiza el estado para disparar el renderizado
      updateMarkers(aviones);  // Pinta los aviones iniciales
    };

    initMap();

    // Actualizar la posición de los aviones cada 20 segundos
    const intervalId = setInterval(async () => {
      const aviones = await obtenerAviones();
      setAvionesInfo(aviones);  // Actualiza el estado para disparar el renderizado
      updateMarkers(aviones);  // Actualiza los marcadores con los nuevos datos
    }, 3000); // 20 segundos

    return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar el componente
  }, []);

  return <div ref={mapRef} style={{ height: '100vh', width: '100%' }}></div>;
};

export default MapaAviones;
