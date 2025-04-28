import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/espana') // Usamos el endpoint de España
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        setData(data); // Guardamos los datos en el estado
      })
      .catch(error => {
        setError(error.message); // Capturamos errores
      });
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
      <h2>Aviones detectados:</h2>
      <ul>
        {data.aviones.map((hex, index) => (
          <li key={index}>{hex}</li>
        ))}
      </ul>

      <h2>Avión más rápido:</h2>
      <p>Hex: {data.masRapido.hex}</p>
      <p>Velocidad: {data.masRapido.velocidad} km/h</p>

      <h2>Avión más lento:</h2>
      <p>Hex: {data.masLento.hex}</p>
      <p>Velocidad: {data.masLento.velocidad} km/h</p>
    </div>
  );
}

export default SpainPlanes;
