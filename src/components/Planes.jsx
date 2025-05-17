import { useEffect, useState } from 'react';

function Planes({ region }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [avgFuel, setAvgFuel] = useState(null);
  const [avgCO2, setAvgCO2] = useState(null);
  const [sortOption, setSortOption] = useState('');
  const [masRapido, setMasRapido] = useState(null);
  const [masLento, setMasLento] = useState(null);

  // Constantes físicas
  const S = 122;
  const C_D = 0.03;
  const TSFC = 0.000016;
  const rhoFuel = 0.80;
  const CO2_F = 3.16;
  const rho0 = 1.225;
  const L = 0.0065;
  const T0 = 288.15;
  const expISA = 5.256;

  const fetchData = () => {
    fetch(`/api/planes?region=${region}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then(resultados => {
        // Unificamos todos los aviones de todas las ubicaciones
        const allAvionesInfo = resultados.flatMap(r => r.avionesInfo || []);
        const { avgFuelLph, avgCO2Kgh, detalles } = calcularConsumoYEmisiones(allAvionesInfo);

        // Calculamos más rápido y más lento globales
        let masRapido = null, masLento = null;
        if (detalles.length > 0) {
          masRapido = detalles.reduce((prev, curr) => (+curr.gs > +prev.gs ? curr : prev), detalles[0]);
          masLento = detalles.reduce((prev, curr) => (+curr.gs < +prev.gs ? curr : prev), detalles[0]);
        }

        setData(detalles); // Guardamos todos los aviones en un solo array
        setError(null);
        setAvgFuel(avgFuelLph);
        setAvgCO2(avgCO2Kgh);
        setMasRapido(masRapido);
        setMasLento(masLento);
        console.log(`Datos actualizados a las ${new Date().toLocaleTimeString()}`);
      })
      .catch(error => {
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [region]);

  const calcularConsumoYEmisiones = (avionesInfo = []) => {
    const hFallback = 11000;

    const valid = avionesInfo
      .map(av => ({
        ...av,
        gs: parseFloat(av.gs),
        alt_baro: parseFloat(av.alt_baro)
      }))
      .filter(av => !isNaN(av.gs) && av.gs > 0);

    if (!valid.length) {
      return {
        avgFuelLph: 'N/A',
        avgCO2Kgh: 'N/A',
        detalles: []
      };
    }

    const detalles = valid.map(av => {
      const V = (av.gs * 1000) / 3600;
      const h = isNaN(av.alt_baro) ? hFallback : av.alt_baro * 0.3048;
      const rho = rho0 * Math.pow(1 - (L * h) / T0, expISA);
      const D = 0.5 * rho * V * V * S * C_D;
      const mDot = TSFC * D;

      return {
        ...av,
        fuelLph: ((mDot / rhoFuel) * 3600).toFixed(0),
        co2Kgh: ((mDot * CO2_F) * 3600).toFixed(0)
      };
    });

    const sumFuel = detalles.reduce((sum, v) => sum + parseFloat(v.fuelLph), 0);
    const sumCO2 = detalles.reduce((sum, v) => sum + parseFloat(v.co2Kgh), 0);

    return {
      avgFuelLph: (sumFuel / detalles.length).toFixed(0),
      avgCO2Kgh: (sumCO2 / detalles.length).toFixed(0),
      detalles
    };
  };

  const copiarInfoVuelo = (avion) => {
    const now = new Date();
    const horaActual = now.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const texto = `Información del vuelo - ${avion.hex}
Hora actual - ${horaActual}

Velocidad -> ${avion.gs ?? 'N/A'} km/h
Altitud -> ${avion.alt_baro ? `${avion.alt_baro} ft` : 'N/A'}
Consumo -> ${avion.fuelLph ?? 'N/A'} L/h
Emisiones de CO2 -> ${avion.co2Kgh ?? 'N/A'} kg/h

Datos obtenidos por APIones (http://localhost:4321/${region})`;

    navigator.clipboard.writeText(texto)
      .then(() => {
        console.log('Información copiada al portapapeles.');
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const ordenarAviones = (aviones) => {
    const sorted = [...aviones];
    switch (sortOption) {
      case 'velocidadAsc':
        return sorted.sort((a, b) => a.gs - b.gs);
      case 'velocidadDesc':
        return sorted.sort((a, b) => b.gs - a.gs);
      case 'consumoAsc':
        return sorted.sort((a, b) => a.fuelLph - b.fuelLph);
      case 'consumoDesc':
        return sorted.sort((a, b) => b.fuelLph - a.fuelLph);
      case 'emisionAsc':
        return sorted.sort((a, b) => a.co2Kgh - b.co2Kgh);
      case 'emisionDesc':
        return sorted.sort((a, b) => b.co2Kgh - a.co2Kgh);
      default:
        return aviones;
    }
  };

  if (error) {
    return <div className="text-red-400 text-center mt-4">Error: {error}</div>;
  }

  if (!data.length) {
    return <div className="text-gray-300 text-center mt-4">Cargando datos iniciales...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-black">Estado de vuelos sobre {region}</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">Avión más rápido</h2>
          <p><strong>Hex:</strong> {masRapido?.hex ?? 'N/A'}</p>
          <p><strong>Velocidad:</strong> {masRapido?.gs?.toFixed(0) ?? 'N/A'} km/h</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">Avión más lento</h2>
          <p><strong>Hex:</strong> {masLento?.hex ?? 'N/A'}</p>
          <p><strong>Velocidad:</strong> {masLento?.gs?.toFixed(0) ?? 'N/A'} km/h</p>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl shadow-md mb-10">
        <h2 className="text-xl font-semibold mb-2">Consumo y emisiones promedio</h2>
        <p><strong>Consumo medio:</strong> {avgFuel ?? 'Calculando...'} L/h</p>
        <p><strong>Emisión media:</strong> {avgCO2 ?? 'Calculando...'} kg CO₂/h</p>
      </div>

      <div className="overflow-x-auto bg-gray-900 rounded-xl shadow-md">
        <table className="min-w-full table-auto text-sm text-left text-gray-300">
          <thead className="bg-gray-700 text-gray-200 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Hex</th>
              <th className="px-4 py-3">Longitud</th>
              <th className="px-4 py-3">Latitud</th>
              <th className="px-4 py-3">Consumo (L/h)</th>
              <th className="px-4 py-3">Emisión CO₂ (kg/h)</th>
              <th className="px-2 py-2 w-40 text-right">
                <select
                  value={sortOption}
                  onChange={handleSortChange}
                  className="bg-gray-800 text-white text-xs rounded px-1 py-0.5 w-full"
                >
                  <option value="">Ordenar por...</option>
                  <option value="velocidadAsc">Velocidad ↑</option>
                  <option value="velocidadDesc">Velocidad ↓</option>
                  <option value="consumoAsc">Consumo ↑</option>
                  <option value="consumoDesc">Consumo ↓</option>
                  <option value="emisionAsc">Emisión ↑</option>
                  <option value="emisionDesc">Emisión ↓</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {ordenarAviones(data).map((avion, index) => (
              <tr key={index} className="hover:bg-gray-800 transition-colors group">
                <td className="px-4 py-2"><img src={`./paises/${avion.pais}.png`} alt="bandera" className="w-6 h-6 inline-block mr-2" />{avion.pais}</td>
                <td className="px-4 py-2">{avion.hex}</td>
                <td className="px-4 py-2">{avion.lon ?? 'N/A'}</td>
                <td className="px-4 py-2">{avion.lat ?? 'N/A'}</td>
                <td className="px-4 py-2">{avion.fuelLph ?? 'N/A'}</td>
                <td className="px-4 py-2">{avion.co2Kgh ?? 'N/A'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => copiarInfoVuelo(avion)}
                    className="text-gray-400 text-xs hover:text-white hover:underline transition-all"
                  >
                    Copiar información
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Planes;