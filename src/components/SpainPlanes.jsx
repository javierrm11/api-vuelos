import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Función para obtener los datos
  const fetchData = () => {
    fetch('/api/SpainPlanes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(newData => {
        setData(newData);  // Actualizar los datos siempre
        setError(null);
        const currentTime = new Date().toLocaleTimeString();
        console.log(`Datos actualizados a las ${currentTime}`);
      })
      .catch(error => {
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchData(); // Cargar datos al iniciar
    const intervalId = setInterval(fetchData, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(intervalId); // Limpiar al desmontar
  }, []); // Ejecutar solo una vez, al montar

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Cargando datos iniciales...</div>;
  }

  return (
    <div>
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
