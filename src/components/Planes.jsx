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
  // Estados principales
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [avgFuel, setAvgFuel] = useState(null);
  const [avgCO2, setAvgCO2] = useState(null);
  const [totalFuel, setTotalFuel] = useState(null);
  const [totalCO2, setTotalCO2] = useState(null);
  const [masRapido, setMasRapido] = useState(null);
  const [masLento, setMasLento] = useState(null);
  const [mensajeCopiado, setMensajeCopiado] = useState(null);
  const [paisesDisponibles, setPaisesDisponibles] = useState([]);
  
  // Estados para el gráfico
  const [sortOption, setSortOption] = useState("");
  const [filterConsumo, setFilterConsumo] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterPaisChart, setFilterPaisChart] = useState("todos");
  
  // Estados para el listado
  const [currentAvionesPage, setCurrentAvionesPage] = useState(1);
  const [avionesPerPage] = useState(30);
  const [avionesSortOption, setAvionesSortOption] = useState("");
  const [filterPaisList, setFilterPaisList] = useState("todos");

  // Constantes para los cálculos
  const S = 122;
  const C_D = 0.03;
  const TSFC = 0.000016;
  const rhoFuel = 0.8;
  const CO2_F = 3.16;
  const rho0 = 1.225;
  const L = 0.0065;
  const T0 = 288.15;
  const expISA = 5.256;

  // Obtener datos de la API
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
        const { avgFuelLph, avgCO2Kgh, totalFuelLph, totalCO2Kgh, detalles } =
          calcularConsumoYEmisiones(allAvionesInfo);

        let masRapido = null, masLento = null;
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

        const paises = [...new Set(detalles.map(avion => avion.pais))].filter(Boolean);
        setPaisesDisponibles(paises);
        setData(detalles);
        setError(null);
        setAvgFuel(avgFuelLph);
        setAvgCO2(avgCO2Kgh);
        setTotalFuel(totalFuelLph);
        setTotalCO2(totalCO2Kgh);
        setMasRapido(masRapido);
        setMasLento(masLento);
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
        totalFuelLph: "N/A",
        totalCO2Kgh: "N/A",
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
      totalFuelLph: sumFuel.toFixed(0),
      totalCO2Kgh: sumCO2.toFixed(0),
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

Datos obtenidos por ApiVuelos (http://localhost:4321/${region})`;

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

  const ordenarAvionesListado = (aviones) => {
    const sorted = [...aviones];
    switch (avionesSortOption) {
      case "hexAsc":
        return sorted.sort((a, b) => a.hex.localeCompare(b.hex));
      case "hexDesc":
        return sorted.sort((a, b) => b.hex.localeCompare(a.hex));
      case "velocidadAsc":
        return sorted.sort((a, b) => a.gs - b.gs);
      case "velocidadDesc":
        return sorted.sort((a, b) => b.gs - a.gs);
      case "altitudAsc":
        return sorted.sort((a, b) => (a.alt_baro || 0) - (b.alt_baro || 0));
      case "altitudDesc":
        return sorted.sort((a, b) => (b.alt_baro || 0) - (a.alt_baro || 0));
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

  // Función para filtrar y ordenar los datos del gráfico
  const getFilteredChartData = () => {
    let filteredData = [...data];
    
    // Aplicar filtro de país solo para el gráfico
    if (filterPaisChart !== "todos") {
      filteredData = filteredData.filter(avion => avion.pais === filterPaisChart);
    }
    
    // Aplicar filtro de consumo solo para el gráfico
    switch (filterConsumo) {
      case "mayorConsumo":
        return [...filteredData].sort((a, b) => b.fuelLph - a.fuelLph);
      case "menorConsumo":
        return [...filteredData].sort((a, b) => a.fuelLph - b.fuelLph);
      case "mayorEmision":
        return [...filteredData].sort((a, b) => b.co2Kgh - a.co2Kgh);
      case "menorEmision":
        return [...filteredData].sort((a, b) => a.co2Kgh - b.co2Kgh);
      default:
        return ordenarAviones(filteredData);
    }
  };

  // Función para filtrar y ordenar los datos del listado
  const getFilteredListData = () => {
    let filteredData = [...data];
    
    // Aplicar filtro de país solo para el listado
    if (filterPaisList !== "todos") {
      filteredData = filteredData.filter(avion => avion.pais === filterPaisList);
    }
    
    // Aplicar ordenamiento solo para el listado
    return ordenarAvionesListado(filteredData);
  };

  // Función para obtener los datos paginados del gráfico
  const getAvionesPagina = () => {
    const filteredData = getFilteredChartData();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Función para obtener los datos paginados del listado
  const getCurrentAviones = () => {
    const filteredData = getFilteredListData();
    const startIndex = (currentAvionesPage - 1) * avionesPerPage;
    const endIndex = startIndex + avionesPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  // Calcular total de páginas para el gráfico
  const totalPages = Math.ceil(getFilteredChartData().length / itemsPerPage);
  
  // Calcular total de páginas para el listado
  const totalAvionesPages = Math.ceil(getFilteredListData().length / avionesPerPage);

  // Funciones de paginación
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const paginateAviones = (pageNumber) => setCurrentAvionesPage(pageNumber);

  if (error) {
    return <div className="text-red-400 text-center mt-4">Error: {error}</div>;
  }

  if (!data.length) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-light bg-background relative">
      <p className="absolute right-4 top-4 text-border dark:text-light text-sm sm:text-base">
        <strong>Última actualización:</strong> {new Date().toLocaleTimeString()}
      </p>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-text">
        Estado de vuelos sobre {region}
      </h1>

      <div className="flex flex-wrap gap-4 sm:gap-6 mb-6">
        <div className="flex-[0_0_100%] sm:flex-[1_1_30%] bg-accent p-4 rounded shadow-md text-light dark:text-text">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Aviones en vuelo</h2>
          <p className="text-2xl sm:text-3xl font-bold">{data.length}</p>
        </div>
        <div className="flex-[0_0_100%] sm:flex-[1_1_30%] bg-primary p-4 rounded shadow-md text-light dark:text-text">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Avión más rápido</h2>
          <p className="text-sm sm:text-base">
            <strong>Hex:</strong> {masRapido?.hex ?? "N/A"}
          </p>
          <p className="text-sm sm:text-base">
            <strong>Velocidad:</strong> {masRapido?.gs?.toFixed(0) ?? "N/A"} km/h
          </p>
        </div>
        <div className="flex-[0_0_100%] sm:flex-[1_1_30%] bg-primary p-4 rounded shadow-md text-light dark:text-text">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Avión más lento</h2>
          <p className="text-sm sm:text-base">
            <strong>Hex:</strong> {masLento?.hex ?? "N/A"}
          </p>
          <p className="text-sm sm:text-base">
            <strong>Velocidad:</strong> {masLento?.gs?.toFixed(0) ?? "N/A"} km/h
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-light dark:bg-border text-border dark:text-light p-4 rounded">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Consumo y emisiones totales
          </h2>
          <p className="text-sm sm:text-base">
            <strong>Consumo:</strong> {totalFuel ?? "Calculando..."} L/h
          </p>
          <p className="text-sm sm:text-base">
            <strong>Emisión:</strong> {totalCO2 ?? "Calculando..."} kg CO₂/h
          </p>
        </div>

        <div className="bg-light dark:bg-border text-border dark:text-light p-4 rounded">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">
            Consumo y emisiones promedio
          </h2>
          <p className="text-sm sm:text-base">
            <strong>Consumo:</strong> {avgFuel ?? "Calculando..."} L/h
          </p>
          <p className="text-sm sm:text-base">
            <strong>Emisión:</strong> {avgCO2 ?? "Calculando..."} kg CO₂/h
          </p>
        </div>
      </div>

      <div className="bg-light dark:bg-border dark:text-light p-4 rounded mb-6 text-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-5">
          <h2 className="text-lg sm:text-xl font-semibold">
            Comparativa de Consumo de Combustible (L/h) y Emisiones de CO₂ (kg/h)
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="filtroConsumo" className="block text-sm mb-1 text-text">
                Filtro gráfico
              </label>
              <select
                id="filtroConsumo"
                value={filterConsumo}
                onChange={(e) => {
                  setFilterConsumo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 bg-secondary text-sm text-text rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos</option>
                <option value="mayorConsumo">Mayor consumo</option>
                <option value="menorConsumo">Menor consumo</option>
                <option value="mayorEmision">Mayor emisiones</option>
                <option value="menorEmision">Menor emisiones</option>
              </select>
            </div>
            
            {paisesDisponibles.length > 1 && (
              <div className="w-full sm:w-auto">
                <label htmlFor="filtroPaisChart" className="block text-sm mb-1 text-text">
                  País (Gráfico)
                </label>
                <select
                  id="filtroPaisChart"
                  value={filterPaisChart}
                  onChange={(e) => {
                    setFilterPaisChart(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-48 bg-secondary text-sm text-text rounded px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="todos">Todos los países</option>
                  {paisesDisponibles.map(pais => (
                    <option key={pais} value={pais}>
                      {pais}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={getAvionesPagina()}
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
            <YAxis 
              tick={{ fill: "#ccc" }}
              domain={[0, 3000]}
              allowDecimals={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ bottom: 5 }} />
            <Bar dataKey="fuelLph" fill="#2196f3" name="Consumo L/h" />
            <Bar dataKey="co2Kgh" fill="#f44336" name="CO₂ kg/h" />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-secondary hover:bg-secondary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-chevrons-left"
            >
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-arrow-left"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span className="text-sm px-2">
            Pág {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-arrow-right"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-secondary hover:bg-secondary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-chevrons-right"
            >
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded shadow-md bg-background">
        <div className="p-4 bg-light dark:bg-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-auto">
            <label htmlFor="avionesSort" className="block text-sm mb-1 text-text">
              Ordenar listado
            </label>
            <select
              id="avionesSort"
              value={avionesSortOption}
              onChange={(e) => {
                setAvionesSortOption(e.target.value);
                setCurrentAvionesPage(1);
              }}
              className="w-full md:w-48 bg-secondary text-sm rounded px-3 py-2 text-text border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Predeterminado</option>
              <option value="hexAsc">Hex (A-Z)</option>
              <option value="hexDesc">Hex (Z-A)</option>
              <option value="velocidadAsc">Velocidad (↑)</option>
              <option value="velocidadDesc">Velocidad (↓)</option>
              <option value="altitudAsc">Altitud (↑)</option>
              <option value="altitudDesc">Altitud (↓)</option>
              <option value="consumoAsc">Consumo (↑)</option>
              <option value="consumoDesc">Consumo (↓)</option>
              <option value="emisionAsc">Emisiones (↑)</option>
              <option value="emisionDesc">Emisiones (↓)</option>
            </select>
          </div>

          {paisesDisponibles.length > 1 && (
            <div className="w-full md:w-auto">
              <label htmlFor="filtroPaisList" className="block text-sm mb-1 text-text">
                País (Listado)
              </label>
              <select
                id="filtroPaisList"
                value={filterPaisList}
                onChange={(e) => {
                  setFilterPaisList(e.target.value);
                  setCurrentAvionesPage(1);
                }}
                className="w-full md:w-48 bg-secondary text-sm rounded px-3 py-2 text-text border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos los países</option>
                {paisesDisponibles.map(pais => (
                  <option key={pais} value={pais}>
                    {pais}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap">
          {getCurrentAviones().map((avion, index) => (
            <div
              key={avion.hex}
              className="flex-[0_0_100%] md:flex-[1_1_40%] 2xl:flex-[1_1_30%] items-center justify-between p-4 border-b relative hover:brightness-95 bg-light dark:bg-border border-secondary"
            >
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={`./paises/${avion.pais}.png`}
                  alt="Bandera"
                  className="w-6 h-6"
                />
                <h3 className="text-lg font-semibold text-border dark:text-light">
                  {avion.flight || "Desconocido"}
                </h3>
              </div>

              <details className="text-sm text-border dark:text-light transition-all duration-500">
                <summary className="cursor-pointer absolute top-5 right-7 hover:underline text-primary dark:text-light">
                  Detalles del vuelo
                </summary>

                <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div className="space-y-2">
                    <p>
                      <strong>Hex:</strong> {avion.hex}
                    </p>
                    <p>
                      <strong>País:</strong> {avion.pais || "Desconocido"}
                    </p>
                    <p>
                      <strong>Modelo:</strong> {avion.modelo || "Desconocido"}
                    </p>
                    <p>
                      <strong>Velocidad:</strong>{" "}
                      {avion.gs ? `${avion.gs.toFixed(0)} km/h` : "N/A"}
                    </p>
                    <p>
                      <strong>Ubicación:</strong> {avion.lat}, {avion.lon}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p>
                      <strong>Altitud:</strong>{" "}
                      {avion.alt_baro ? `${avion.alt_baro} ft` : "N/A"}
                    </p>
                    <p>
                      <strong>Rumbo:</strong> {avion.track ?? "N/A"}°
                    </p>
                    <p>
                      <strong>Consumo:</strong>{" "}
                      {avion.fuelLph ? `${avion.fuelLph} L/h` : "N/A"}
                    </p>
                    <p>
                      <strong>Emisiones de CO₂:</strong>{" "}
                      {avion.co2Kgh ? `${avion.co2Kgh} kg/h` : "N/A"}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end w-full mt-2">
                    <button
                      onClick={() => copiarInfoVuelo(avion)}
                      className="px-4 py-2 rounded-md transition-colors bg-primary hover:bg-primary-dark text-light"
                    >
                      Copiar información
                    </button>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center gap-2 p-4 bg-light dark:bg-border">
          <button
            onClick={() => paginateAviones(1)}
            disabled={currentAvionesPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentAvionesPage === 1
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-secondary hover:bg-secondary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-chevrons-left"
            >
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
          <button
            onClick={() => paginateAviones(currentAvionesPage - 1)}
            disabled={currentAvionesPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentAvionesPage === 1
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-arrow-left"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span className="text-sm px-2 text-text">
            Pág {currentAvionesPage} de {totalAvionesPages}
          </span>
          <button
            onClick={() => paginateAviones(currentAvionesPage + 1)}
            disabled={currentAvionesPage === totalAvionesPages}
            className={`px-3 py-1 rounded-md ${
              currentAvionesPage === totalAvionesPages
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-arrow-right"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
          <button
            onClick={() => paginateAviones(totalAvionesPages)}
            disabled={currentAvionesPage === totalAvionesPages}
            className={`px-3 py-1 rounded-md ${
              currentAvionesPage === totalAvionesPages
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : "bg-secondary hover:bg-secondary-dark text-light cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="feather feather-chevrons-right"
            >
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>
        </div>

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