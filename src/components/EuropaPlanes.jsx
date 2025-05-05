import { useEffect, useState } from 'react';

function EuropaPlanes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = () => {
    fetch('/api/EuropaPlanes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(newData => {
        // Actualizar siempre si data es null o si los datos son diferentes
        if (!data || JSON.stringify(newData) !== JSON.stringify(data)) {
          setData(newData);
          const currentTime = new Date().toLocaleTimeString();
          console.log(`Datos actualizados a las ${currentTime}`);
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
      <h2>Avión más rápido</h2>
      <p>Hex: {data.masRapidoDeEuropa.hex}</p>
      <p>Velocidad: {data.masRapidoDeEuropa.velocidad} km/h</p>

      <h2>Avión más lento</h2>
      <p>Hex: {data.masLentoDeEuropa.hex}</p>
      <p>Velocidad: {data.masLentoDeEuropa.velocidad} km/h</p>

      <h2>Todos los aviones detectados</h2>
      <p>
        {data.todosAviones.length}
      </p>
    </div>
  );
}

export default EuropaPlanes;
