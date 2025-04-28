import { useEffect, useState } from 'react';

function PIA() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/pia')  // Use PIA endpoint
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        setData(data); // Set data to state
      })
      .catch(error => {
        setError(error.message); // Manejo de errores
      });
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Datos PIA</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default PIA;