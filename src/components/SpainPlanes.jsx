import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [avgFuel, setAvgFuel] = useState(null);
  const [avgCO2, setAvgCO2]   = useState(null);

  // Constantes físicas
  const S        = 122;
  const C_D      = 0.03;
  const TSFC     = 0.000016;
  const rhoFuel  = 0.80;
  const CO2_F    = 3.16;
  const rho0     = 1.225;
  const L        = 0.0065;
  const T0       = 288.15;
  const expISA   = 5.256;

  const fetchData = () => {
    fetch('/api/SpainPlanes')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(newData => {
        setData(newData);
        setError(null);
        const currentTime = new Date().toLocaleTimeString();
        console.log(`Datos actualizados a las ${currentTime}`);

        // Calcular consumo/emisiones
        const { avgFuelLph, avgCO2Kgh } = calcularConsumoYEmisiones(newData.avionesInfo);
        setAvgFuel(avgFuelLph);
        setAvgCO2(avgCO2Kgh);
      })
      .catch(error => {
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const calcularConsumoYEmisiones = (avionesInfo = []) => {
    const hFallback = 11000;

    const valid = avionesInfo
      .map(av => ({
        gs: parseFloat(av.gs),
        alt_baro: parseFloat(av.alt_baro)
      }))
      .filter(av => !isNaN(av.gs) && av.gs > 0);

    if (!valid.length) {
      return { avgFuelLph: 'N/A', avgCO2Kgh: 'N/A' };
    }

    const resultados = valid.map(({ gs, alt_baro }) => {
      const V = (gs * 1000) / 3600;
      const h = isNaN(alt_baro) ? hFallback : alt_baro * 0.3048;
      const rho = rho0 * Math.pow(1 - (L * h) / T0, expISA);
      const D = 0.5 * rho * V * V * S * C_D;
      const mDot = TSFC * D;

      return {
        fuelLph: (mDot / rhoFuel) * 3600,
        co2Kgh:  (mDot * CO2_F) * 3600
      };
    });

    const sumFuel = resultados.reduce((sum, v) => sum + v.fuelLph, 0);
    const sumCO2  = resultados.reduce((sum, v) => sum + v.co2Kgh, 0);

    return {
      avgFuelLph: (sumFuel / resultados.length).toFixed(0),
      avgCO2Kgh:  (sumCO2 / resultados.length).toFixed(0),
    };
  };

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

      <h2>Consumo y emisiones promedio</h2>
      <p>Consumo medio: {avgFuel ?? 'Calculando...'} L/h</p>
      <p>Emisión media: {avgCO2 ?? 'Calculando...'} kg CO₂/h</p>

      <h2>Todos los aviones detectados</h2>
      <table>
        <thead>
          <tr>
            <th>País</th>
            <th>Hex</th>
            <th>Longitud</th>
            <th>Latitud</th>
          </tr>
        </thead>
        <tbody>
          {data.avionesInfo.map((avion, index) => (
            <tr key={index}>
              <td>{data.pais}</td>
              <td>{avion.hex}</td>
              <td>{avion.lon ?? 'N/A'}</td>
              <td>{avion.lat ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SpainPlanes;
