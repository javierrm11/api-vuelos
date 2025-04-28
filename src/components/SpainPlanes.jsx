import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false); // Nuevo: saber si estamos actualizando

  const fetchData = () => {
    setUpdating(true);
    fetch('/api/SpainPlane')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(newData => {
        setData(newData);
        setError(null);
      })
      .catch(error => {
        setError(error.message);
      })
      .finally(() => {
        setUpdating(false); // Terminó de actualizar
      });
  };

  useEffect(() => {
    fetchData(); // Primera carga
    const intervalId = setInterval(fetchData, 10000); // Luego cada 10 segundos

    return () => clearInterval(intervalId); // Limpiar intervalo al desmontar
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Cargando datos iniciales...</div>; // Solo en primera carga
  }

  return (
    <div>
      <h1>Aviones sobre España</h1>

      {updating && <p>Actualizando datos...</p>} {/* Pequeño mensaje mientras refresca */}

      <h2>Avión más rápido</h2>
      <p>Hex: {data.masRapido.hex}</p>
      <p>Velocidad: {data.masRapido.velocidad} km/h</p>

      <h2>Avión más lento</h2>
      <p>Hex: {data.masLento.hex}</p>
      <p>Velocidad: {data.masLento.velocidad} km/h</p>

      <h2>Todos los aviones detectados</h2>
      <ul>
        {data.aviones.map((hex, index) => (
          <li key={index}>{hex}</li>
        ))}
      </ul>
    </div>
  );
}

export default SpainPlanes;
