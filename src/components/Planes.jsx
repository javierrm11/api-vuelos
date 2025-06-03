import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import Loading from "./Loading";

function Planes({ region }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [avgFuel, setAvgFuel] = useState(null);
  const [avgCO2, setAvgCO2] = useState(null);
  const [sortOption, setSortOption] = useState("");
  const [masRapido, setMasRapido] = useState(null);
  const [masLento, setMasLento] = useState(null);
  const [filterConsumo, setFilterConsumo] = useState("todos");
  const [mensajeCopiado, setMensajeCopiado] = useState(null);

  const S = 122;
  const C_D = 0.03;
  const TSFC = 0.000016;
  const rhoFuel = 0.8;
  const CO2_F = 3.16;
  const rho0 = 1.225;
  const L = 0.0065;
  const T0 = 288.15;
  const expISA = 5.256;

  const fetchData = () => {
    fetch(`/api/planes?region=${region}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error en la solicitud: " + response.statusText);
        }
        return response.json();
      })
      .then((resultados) => {
        const allAvionesInfo = resultados.flatMap((r) => r.avionesInfo || []);
        const { avgFuelLph, avgCO2Kgh, detalles } =
          calcularConsumoYEmisiones(allAvionesInfo);

        let masRapido = null,
          masLento = null;
        if (detalles.length > 0) {
          masRapido = detalles.reduce(
            (prev, curr) => (+curr.gs > +prev.gs ? curr : prev),
            detalles[0]
          );
          masLento = detalles.reduce(
            (prev, curr) => (+curr.gs < +prev.gs ? curr : prev),
            detalles[0]
          );
        }

        setData(detalles);
        setError(null);
        setAvgFuel(avgFuelLph);
        setAvgCO2(avgCO2Kgh);
        setMasRapido(masRapido);
        setMasLento(masLento);
        console.log(
          `Datos actualizados a las ${new Date().toLocaleTimeString()}`
        );
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [region]);

  const calcularConsumoYEmisiones = (avionesInfo = []) => {
    const hFallback = 11000;

    const valid = avionesInfo
      .map((av) => ({
        ...av,
        gs: parseFloat(av.gs),
        alt_baro: parseFloat(av.alt_baro),
      }))
      .filter((av) => !isNaN(av.gs) && av.gs > 0);

    if (!valid.length) {
      return {
        avgFuelLph: "N/A",
        avgCO2Kgh: "N/A",
        detalles: [],
      };
    }

    const detalles = valid.map((av) => {
      const V = (av.gs * 1000) / 3600;
      const h = isNaN(av.alt_baro) ? hFallback : av.alt_baro * 0.3048;
      const rho = rho0 * Math.pow(1 - (L * h) / T0, expISA);
      const D = 0.5 * rho * V * V * S * C_D;
      const mDot = TSFC * D;

      return {
        ...av,
        fuelLph: ((mDot / rhoFuel) * 3600).toFixed(0),
        co2Kgh: (mDot * CO2_F * 3600).toFixed(0),
      };
    });

    const sumFuel = detalles.reduce((sum, v) => sum + parseFloat(v.fuelLph), 0);
    const sumCO2 = detalles.reduce((sum, v) => sum + parseFloat(v.co2Kgh), 0);

    return {
      avgFuelLph: (sumFuel / detalles.length).toFixed(0),
      avgCO2Kgh: (sumCO2 / detalles.length).toFixed(0),
      detalles,
    };
  };

  const copiarInfoVuelo = (avion) => {
    const now = new Date();
    const horaActual = now.toLocaleString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const texto = `Información del vuelo - ${avion.hex}
Hora actual - ${horaActual}

Velocidad -> ${avion.gs ?? "N/A"} km/h
Altitud -> ${avion.alt_baro ? `${avion.alt_baro} ft` : "N/A"}
Consumo -> ${avion.fuelLph ?? "N/A"} L/h
Emisiones de CO2 -> ${avion.co2Kgh ?? "N/A"} kg/h

Datos obtenidos por APIones (http://localhost:4321/${region})`;

    navigator.clipboard
      .writeText(texto)
      .then(() => {
        setMensajeCopiado("¡Información copiada correctamente!");
      })
      .catch(() => {
        setMensajeCopiado("Error al copiar la información... Inténtalo de nuevo.");
      });

    setTimeout(() => setMensajeCopiado(null), 3000);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const ordenarAviones = (aviones) => {
    const sorted = [...aviones];
    switch (sortOption) {
      case "velocidadAsc":
        return sorted.sort((a, b) => a.gs - b.gs);
      case "velocidadDesc":
        return sorted.sort((a, b) => b.gs - a.gs);
      case "consumoAsc":
        return sorted.sort((a, b) => a.fuelLph - b.fuelLph);
      case "consumoDesc":
        return sorted.sort((a, b) => b.fuelLph - a.fuelLph);
      case "emisionAsc":
        return sorted.sort((a, b) => a.co2Kgh - b.co2Kgh);
      case "emisionDesc":
        return sorted.sort((a, b) => b.co2Kgh - a.co2Kgh);
      default:
        return aviones;
    }
  };

  const filtrarPorConsumo = (aviones) => {
    switch (filterConsumo) {
      case "mayorConsumo":
        return ordenarAviones(aviones)
          .sort((a, b) => b.fuelLph - a.fuelLph)
          .slice(0, 10);
      case "menorConsumo":
        return ordenarAviones(aviones)
          .sort((a, b) => a.fuelLph - b.fuelLph)
          .slice(0, 10);
      case "mayorEmision":
        return ordenarAviones(aviones)
          .sort((a, b) => b.co2Kgh - a.co2Kgh)
          .slice(0, 10);
      case "menorEmision":
        return ordenarAviones(aviones)
          .sort((a, b) => a.co2Kgh - b.co2Kgh)
          .slice(0, 10);
      default:
        return ordenarAviones(aviones).slice(0, 10);
    }
  };

  if (error) {
    return <div className="text-red-400 text-center mt-4">Error: {error}</div>;
  }

  if (!data.length) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-light bg-background relative">
      <p className="absolute right-2 top-4 text-border dark:text-light">
        <strong>Última actualización:</strong> {new Date().toLocaleTimeString()}
      </p>
      <h1 className="text-3xl font-bold mb-6 text-text">
        Estado de vuelos sobre {region}
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-primary p-4 rounded-xl shadow-md text-light">
          <h2 className="text-xl font-semibold mb-2">Avión más rápido</h2>
          <p>
            <strong>Hex:</strong> {masRapido?.hex ?? "N/A"}
          </p>
          <p>
            <strong>Velocidad:</strong> {masRapido?.gs?.toFixed(0) ?? "N/A"} km/h
          </p>
        </div>

        <div className="bg-primary p-4 rounded-xl shadow-md text-light">
          <h2 className="text-xl font-semibold mb-2">Avión más lento</h2>
          <p>
            <strong>Hex:</strong> {masLento?.hex ?? "N/A"}
          </p>
          <p>
            <strong>Velocidad:</strong> {masLento?.gs?.toFixed(0) ?? "N/A"} km/h
          </p>
        </div>

        <div className="bg-accent p-4 rounded-xl shadow-md text-light">
          <h2 className="text-xl font-semibold mb-2">Aviones en vuelo</h2>
          <p>
            <strong>Total:</strong> {data.length}
          </p>
        </div>
      </div>

      <div className="bg-light dark:bg-border text-border dark:text-light p-4 rounded-xl mb-10">
        <h2 className="text-xl font-semibold mb-2">Consumo y emisiones promedio</h2>
        <p>
          <strong>Consumo medio:</strong> {avgFuel ?? "Calculando..."} L/h
        </p>
        <p>
          <strong>Emisión media:</strong> {avgCO2 ?? "Calculando..."} kg CO₂/h
        </p>
      </div>

      <div className="bg-light dark:bg-border dark:text-light p-4 rounded-xl mb-10 text-border">
        <div className="pb-5">
          <label htmlFor="filtroConsumo" className="text-sm mr-2">
            Filtro gráfico:
          </label>
          <select
            id="filtroConsumo"
            value={filterConsumo}
            onChange={(e) => setFilterConsumo(e.target.value)}
            className="bg-secondary text-xs rounded px-2 py-1"
          >
            <option value="todos">Todos</option>
            <option value="mayorConsumo">Mayor consumo</option>
            <option value="menorConsumo">Menor consumo</option>
            <option value="mayorEmision">Mayor emisiones</option>
            <option value="menorEmision">Menor emisiones</option>
          </select>
        </div>

        <h2 className="text-xl font-semibold mb-4">
          Comparativa de Consumo de Combustible (L/h) y Emisiones de CO₂ (kg/h)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={filtrarPorConsumo(data)}
            margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis
              dataKey="hex"
              angle={-45}
              textAnchor="end"
              interval={0}
              tick={{ fill: "#ccc", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#ccc" }} />
            <Tooltip />
            <Legend wrapperStyle={{ bottom: 5 }} />
            <Bar
              dataKey="fuelLph"
              fill="#2196f3"
              name="Consumo L/h"
            />
            <Bar dataKey="co2Kgh" fill="#f44336" name="CO₂ kg/h" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-md bg-background">
        {ordenarAviones(data).map((avion, index) => (
          <div
            key={avion.hex}
            className="flex-1 items-center justify-between p-4 border-b relative hover:brightness-95 bg-light dark:bg-border border-secondary"
          >
            <div className="flex items-center gap-2 mb-1">
              <img
                src={`./paises/${avion.pais}.png`}
                alt="Bandera"
                className="w-6 h-6"
              />
              <h3 className="text-lg font-semibold text-border dark:text-light">{avion.flight}</h3>
            </div>

            <details className="text-sm text-border dark:text-light">
              <summary className="cursor-pointer absolute top-5 right-7 hover:underline text-primary dark:text-light">
                Detalles del vuelo
              </summary>

              <div className="mt-6 flex flex-col gap-2 text-xs">
                <div className="flex flex-col md:flex-row md:gap-4">
                  <p className="w-full md:w-[33%]">
                    <strong>Hex:</strong> {avion.hex}
                  </p>
                  <p className="w-full md:w-[33%]">
                    <strong>Velocidad:</strong>{" "}
                    {avion.gs ? `${avion.gs.toFixed(0)} km/h` : "N/A"}
                  </p>
                  <p className="w-full md:w-[33%]">
                    <strong>Altitud:</strong>{" "}
                    {avion.alt_baro ? `${avion.alt_baro} ft` : "N/A"}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row md:gap-4">
                  <p className="w-full md:w-[33%]">
                    <strong>Modelo:</strong> {avion.modelo || "Desconocido"}
                  </p>
                  <p className="w-full md:w-[33%]">
                    <strong>Ubicación:</strong> {avion.lat}, {avion.lon}
                  </p>
                  <p className="w-full md:w-[33%]">
                    <strong>Rumbo:</strong> {avion.track ?? "N/A"}°
                  </p>
                </div>

                <div className="flex flex-col md:flex-row md:gap-4">
                  <p className="w-full md:w-[33%]">
                    <strong>Consumo:</strong>{" "}
                    {avion.fuelLph ? `${avion.fuelLph} L/h` : "N/A"}
                  </p>
                  <p className="w-full md:w-[33%]">
                    <strong>Emisiones de CO₂:</strong>{" "}
                    {avion.co2Kgh ? `${avion.co2Kgh} kg/h` : "N/A"}
                  </p>
                  <p className="w-full md:w-[33%]">
                  </p>
                </div>

                <div className="mt-2">
                  <button
                    onClick={() => copiarInfoVuelo(avion)}
                    className="px-3 py-1 rounded transition-colors bg-primary text-light"
                  >
                    Copiar información
                  </button>
                </div>
              </div>
            </details>
          </div>
        ))}

        {mensajeCopiado && (
          <div className="fixed top-4 right-4 px-4 py-2 rounded shadow-md z-50 animate-fade-in-out bg-accent text-light">
            {mensajeCopiado}
          </div>
        )}
      </div>
    </div>
  );
}

export default Planes;
