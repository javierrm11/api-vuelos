import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = () => {
    fetch('/api/SpainPlanes') // ojo, aquí corregí a '/api/espana' porque tu endpoint se llama espana.js
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        setData(data);
      })
      .catch(error => {
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchData(); // Primera carga
    const intervalId = setInterval(fetchData, 10000); // Luego cada 10 segundos

    return () => clearInterval(intervalId); // Limpiar el intervalo cuando se desmonte
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Cargando datos...</div>;
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
