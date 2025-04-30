// /src/components/SpainPlanes.jsx
import { useEffect, useState } from 'react';

function SpainPlanes() {
  const [data, setData]       = useState(null);
  const [avgFuel, setAvgFuel] = useState(null);
  const [avgCO2, setAvgCO2]   = useState(null);
  const [error, setError]     = useState(null);

  // Parámetros de cálculo
  const S        = 122;      // m², área alar típica
  const C_D      = 0.03;     // coeficiente de arrastre
  const TSFC     = 0.000016; // kg/(N·s)
  const rhoFuel  = 0.80;     // kg/L
  const CO2_F    = 3.16;     // kg CO₂ / kg fuel
  const rho0     = 1.225;    // kg/m³
  const L        = 0.0065;   // K/m
  const T0       = 288.15;   // K
  const expISA   = 5.256;    // exponente atmosférico

  // Fetch cada 10 s
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/SpainPlanes');
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setData(json);
      const { avgFuelLph, avgCO2Kgh } = calculateEmissions(json.avionesInfo);
      setAvgFuel(avgFuelLph);
      setAvgCO2(avgCO2Kgh);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const calculateEmissions = (avionesInfo = []) => {
    // Altitud de crucero por defecto (11 000 m)
    const hFallback = 11000;

    // 1. Filtrar y parsear
    const valid = avionesInfo
      .map(av => ({
        gs: parseFloat(av.gs),
        alt_baro: parseFloat(av.alt_baro)
      }))
      .filter(av => !isNaN(av.gs) && av.gs > 0);

    console.log('Valid aircraft data:', valid);

    if (!valid.length) {
      return { avgFuelLph: 'N/A', avgCO2Kgh: 'N/A' };
    }

    // 2. Calcular por avión
    const vals = valid.map(({ gs, alt_baro }) => {
      const V = (gs * 1000) / 3600;        // km/h → m/s
      const h = isNaN(alt_baro)
        ? hFallback
        : alt_baro * 0.3048;              // pies → m

      const rho = rho0 * Math.pow(1 - (L * h) / T0, expISA);
      const D   = 0.5 * rho * V * V * S * C_D; // N
      const mDot = TSFC * D;                 // kg/s fuel

      return {
        fuelLph: (mDot / rhoFuel) * 3600,    // L/h
        co2Kgh:  (mDot * CO2_F) * 3600       // kg CO₂/h
      };
    });

    console.log('Computed per-plane:', vals);

    // 3. Promediar
    const sumFuel = vals.reduce((sum, v) => sum + v.fuelLph, 0);
    const sumCO2  = vals.reduce((sum, v) => sum + v.co2Kgh, 0);

    return {
      avgFuelLph: (sumFuel / vals.length).toFixed(0),
      avgCO2Kgh:  (sumCO2 / vals.length).toFixed(0),
    };
  };

  if (error) return <div>Error: {error}</div>;
  if (!data)  return <div>Cargando datos…</div>;

  const { masRapido, masLento, aviones } = data;

  return (
    <div>
      <h2>Avión más rápido</h2>
      <p>Hex: {masRapido.hex}</p>
      <p>Velocidad: {masRapido.velocidad} km/h</p>

      <h2>Avión más lento</h2>
      <p>Hex: {masLento.hex}</p>
      <p>Velocidad: {masLento.velocidad} km/h</p>

      <h2>Consumo y emisiones promedio</h2>
      <p>Consumo medio: {avgFuel} L/h</p>
      <p>Emisión media: {avgCO2} kg CO₂/h</p>

      <h2>Todos los aviones detectados</h2>
      <ul>
        {aviones.map(hex => <li key={hex}>{hex}</li>)}
      </ul>
    </div>
  );
}

export default SpainPlanes;
