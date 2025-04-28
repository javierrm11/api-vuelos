import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = () => {
    fetch('/api/SpainPlanes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(newData => {
        // Verificar si los datos son diferentes antes de actualizar el estado
        if (JSON.stringify(newData) !== JSON.stringify(data)) {
          setData(newData);
          const currentTime = new Date().toLocaleTimeString();
          console.log(`Actualizado a las ${currentTime}`);
        }
        setError(null);
      })
      .catch(error => {
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchData(); // Primera carga
    const intervalId = setInterval(fetchData, 10000); // Luego cada 10 segundos

    return () => clearInterval(intervalId); // Limpiar intervalo al desmontar
  }, []); // Dependencias vacías para ejecutar solo al montar

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Cargando datos iniciales...</div>;
  }

  return (
    <div>
      <h1>Aviones sobre España</h1>

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
