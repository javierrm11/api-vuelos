import { useEffect, useRef, useState } from "react";
// Importa Leaflet y sus estilos
const regionesDisponibles = [
  "Spain",
  "Europa",
  "America",
  "Asia",
  "Africa",
  "Oceania",
  "Global",
];

const MapaAviones = () => {
  // Referencias para el mapa y los marcadores
  // Utilizamos useRef para mantener referencias a los elementos del DOM y evitar re-renderizados innecesarios
  // También usamos useState para manejar el estado de los aviones visibles, país seleccionado, radio de búsqueda, etc.
  // useRef nos permite acceder directamente a los elementos del DOM sin causar re-renderizados
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersMap = useRef(new Map());
  const [pais, setPais] = useState("Spain");
  const [avionesVisibles, setAvionesVisibles] = useState([]);
  const [radio, setRadio] = useState(100);
  const [avionesCerca, setAvionesCerca] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const userCircle = useRef(null);
  const userMarkerRef = useRef(null);
  const [infoVisible, setInfoVisible] = useState(false);

  // Manejamos el estado de visibilidad del panel lateral
  // Utilizamos useState para manejar el estado de visibilidad del panel lateral
  // Este estado se utiliza para mostrar u ocultar el panel lateral con información de los aviones
  const obtenerAviones = async () => {
    // Esta función obtiene los aviones de la API según el país seleccionado
    // Utilizamos fetch para realizar la solicitud a la API y obtener los datos de los aviones
    try {
      if (pais === "Global") {
        // Si el país es "Global", obtenemos aviones de todas las regiones
        const regiones = ["Europa", "America", "Asia", "Africa", "Oceania"];
        
        // Realizamos solicitudes paralelas para cada región
        // Utilizamos Promise.all para esperar a que todas las solicitudes se completen
        const resultados = await Promise.all(
          // Mapeamos las regiones y hacemos fetch para cada una
          regiones.map(async (region) => {
            // Realizamos la solicitud a la API para obtener los aviones de la región
            const response = await fetch(`/api/planes?region=${region}`);
            // Verificamos si la respuesta es exitosa
            const data = await response.json();
            // Si hay un error, lo manejamos y devolvemos un array vacío
            if (data.error) return [];
            return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
          })
        );
        // Aplanamos el array de resultados y lo devolvemos
        // Utilizamos flat() para aplanar el array de aviones obtenidos de todas las regiones
        return resultados.flat();
      } else {
        // Si el país no es "Global", obtenemos aviones solo de ese país
        // Realizamos la solicitud a la API para obtener los aviones del país seleccionado
        const response = await fetch(`/api/planes?region=${pais}`);
        const data = await response.json();
        // Verificamos si hay un error en la respuesta
        // Si hay un error, lo manejamos y devolvemos un array vacío
        if (data.error) {
          console.error(`Error al obtener aviones para ${pais}:`, data.error);
          return [];
        }
        // Aplanamos el array de aviones obtenidos de la ubicación del país
        // Utilizamos flatMap para aplanar el array de aviones obtenidos de la ubicación del país
        return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
      }
    } catch (error) {
      // Manejamos cualquier error que ocurra durante la solicitud
      // Mostramos un mensaje de error en la consola
      console.error(`Error al realizar la solicitud para ${pais}:`, error);
      return [];
    }
  };
  // Generamos un icono dinámico basado en la altitud del avión
  // Utilizamos L.divIcon de Leaflet para crear un icono SVG personalizado
  const generarIconoPorAltitud = (alt_baro) => {
    // Esta función genera un icono SVG basado en la altitud del avión
    // Utilizamos un color diferente según el rango de altitud
    let color = "#00cc44";
    if (alt_baro <= 10000) color = "#ff0000";
    else if (alt_baro <= 30000) color = "#ffaa00";
    // Creamos el SVG como una cadena de texto
    const svgHTML = `
      <svg width="32" height="32" viewBox="-0.8 -0.8 17.60 17.60" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0L6 2V5L0 9V11H1L6 10L7 13L5 14V16H11V14L9 13L10 10L15 11H16V9L10 5V2L9 0H7Z" fill="${color}" stroke="black" stroke-width="0.5"/>
      </svg>
    `;
    // Devolvemos un icono Leaflet con el SVG generado
    return L.divIcon({
      html: svgHTML,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };
  // Actualizamos los marcadores en el mapa según los aviones obtenidos
  // Esta función actualiza los marcadores en el mapa según los aviones obtenidos
  // Utilizamos un Map para almacenar los marcadores por su hex
  const updateMarkers = (aviones) => {
    const nuevosHex = new Set(aviones.map((av) => av.hex));
    // Limpiamos los marcadores que ya no están presentes
    // Iteramos sobre los marcadores existentes y eliminamos aquellos que no están en los nuevos aviones

    for (const [hex, marker] of markersMap.current.entries()) {
      // Si el hex del marcador no está en los nuevos aviones, lo eliminamos
      // Utilizamos has() para verificar si el hex está en el conjunto de nuevosHex

      if (!nuevosHex.has(hex)) {
        marker.remove();
        markersMap.current.delete(hex);
      }
    }
    // Iteramos sobre los aviones obtenidos y actualizamos o creamos los marcadores
    // Utilizamos forEach para iterar sobre los aviones y actualizar o crear los marcadores

    aviones.forEach((avion) => {
      const { hex, lat, lon, t, flight, pais, track, alt_baro, gs } = avion;
      const iconoDinamico = generarIconoPorAltitud(alt_baro || 0);
      // Verificamos si el marcador ya existe para este hex
      // Si el marcador ya existe, actualizamos su posición y propiedades
      // Si no existe, creamos un nuevo marcador y lo añadimos al mapa

      if (markersMap.current.has(hex)) {
        const marker = markersMap.current.get(hex);
        marker.setLatLng([lat, lon]);
        marker.setRotationAngle(track || 0);
        marker.setIcon(iconoDinamico);
      } else {
        // Si el marcador no existe, creamos uno nuevo

        const marker = L.marker([lat, lon], {
          icon: iconoDinamico,
          rotationAngle: track || 0,
          rotationOrigin: "center center",
        }).addTo(mapInstance.current);

        // Añadimos el marcador al mapa y lo asociamos al hex

        marker.bindPopup(`
          <div style="font-size: 14px; line-height: 1.3; max-width: 220px;">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <b style="margin-right: 6px;">País:</b> 
              <img src="./paises/${
                avion.pais
              }.png" alt="bandera" style="width: 18px; height: 18px; margin-left: 4px;"/>
            </div>
            <div><b>Hex:</b> ${hex}</div>
            <div><b>Vuelo:</b> ${flight || "N/A"}</div>
            <div><b>Tipo:</b> ${t || "N/A"}</div>
            <div><b>Velocidad:</b> ${gs} kt</div>
            <div><b>Altitud:</b> ${alt_baro} ft</div>
            <div><b>Rumbo:</b> ${track || "N/A"}°</div>
          </div>
        `);
        // Añadimos el nuevo marcador al mapa y al Map de marcadores
        markersMap.current.set(hex, marker);
      }
    });
    // Ordenamos los aviones visibles por velocidad (gs) de mayor a menor
    // Utilizamos sort() para ordenar los aviones por su velocidad (gs) de mayor a menor
    // Si gs es undefined, lo tratamos como 0 para evitar errores de comparación

    setAvionesVisibles(aviones.sort((a, b) => (b.gs || 0) - (a.gs || 0)));
  };

  // Calculamos la distancia entre dos puntos geográficos utilizando la fórmula del haversine
  // Esta función calcula la distancia entre dos puntos geográficos dados sus latitudes y longitudes
  const distancia = (lat1, lon1, lat2, lon2) => {
    // Utilizamos la fórmula del haversine para calcular la distancia entre dos puntos en la superficie de la Tierra
    // La fórmula del haversine es adecuada para distancias cortas y tiene en cuenta la curvatura de la Tierra  
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Marcamos un radio alrededor de la ubicación del usuario
  // Esta función utiliza la API de geolocalización del navegador para obtener la ubicación del usuario
  // Luego, centra el mapa en esa ubicación y dibuja un círculo alrededor de ella con el radio especificado
  // Si no se puede obtener la ubicación, muestra un mensaje de error

  const marcarRadio = () => {
    if (!navigator.geolocation || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPos([latitude, longitude]);
        mapInstance.current.setView([latitude, longitude], 8);
      },
      () => {
        alert("No se pudo obtener tu ubicación");
      }
    );
  };
  // Inicializamos el mapa y configuramos los eventos necesarios
  // Utilizamos useEffect para inicializar el mapa y configurar los eventos necesarios
  useEffect(() => {
    let intervalId;
    // Importamos los estilos de Leaflet y la librería leaflet-rotatedmarker
    // Utilizamos import() para cargar los estilos y la librería de forma dinámica
    const initMap = async () => {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      await import("leaflet-rotatedmarker");
      // Verificamos si el contenedor del mapa y la instancia del mapa ya están definidos
      // Si ya están definidos, no hacemos nada
      // Si no están definidos, creamos una nueva instancia del mapa y configuramos los tiles
      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current).setView([40.4168, -3.7038], 6);
      mapInstance.current = map;
      // Añadimos la capa de OpenStreetMap al mapa
      // Utilizamos L.tileLayer para añadir la capa de OpenStreetMap al mapa
      // Configuramos la capa con los tiles de OpenStreetMap y la atribución correspondiente
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      // Añadimos controles de zoom al mapa

      if (navigator.geolocation) {
        // Si el navegador soporta geolocalización, intentamos obtener la ubicación del usuario
        // Utilizamos navigator.geolocation.getCurrentPosition para obtener la ubicación del usuario
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserPos([latitude, longitude]);
            map.setView([latitude, longitude], 8);
            // Añadimos un marcador en la ubicación del usuario
            // Utilizamos L.circleMarker para crear un marcador circular en la ubicación del usuario
            const userMarker = L.circleMarker([latitude, longitude], {
              radius: 8,
              fillColor: "#3388ff",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8,
            }).addTo(map);
            userMarker.bindPopup("Tu ubicación").openPopup();
            userMarkerRef.current = userMarker;
          },
          (error) => {
            console.warn("Error obteniendo ubicación:", error.message);
          },
          { enableHighAccuracy: true } // <-- Añade esta línea
        );
      }
      // Añadimos un control de escala al mapa
      const legend = L.control({ position: "topright" });
      legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.innerHTML = `
          <h4 style="margin-top: 0; margin-bottom: 8px; font-weight: 600; font-size: 14px;">Altitud</h4>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="background:#ff0000;width:14px;height:14px;display:inline-block;margin-right:8px; border-radius: 3px;"></span> ≤ 10.000 ft
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="background:#ffaa00;width:14px;height:14px;display:inline-block;margin-right:8px; border-radius: 3px;"></span> 10.001 - 30.000 ft
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background:#00cc44;width:14px;height:14px;display:inline-block;margin-right:8px; border-radius: 3px;"></span> &gt; 30.000 ft
          </div>
        `;
        div.style.backgroundColor = "#fff";
        div.style.padding = "12px 16px";
        div.style.borderRadius = "8px";
        div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
        div.style.fontSize = "13px";
        div.style.color = "#222";
        return div;
      };
      legend.addTo(map);
    };
    // Iniciamos el mapa y comenzamos a obtener los aviones
    // Utilizamos una función asíncrona para inicializar el mapa y comenzar a obtener los aviones
    const startFetching = async () => {
      const aviones = await obtenerAviones();
      updateMarkers(aviones);
      // Configuramos un intervalo para actualizar los aviones cada 10 segundos
      // Utilizamos setInterval para llamar a obtenerAviones y actualizar los marcadores cada 10 segundos
      intervalId = setInterval(async () => {
        const nuevosAviones = await obtenerAviones();
        updateMarkers(nuevosAviones);
      }, 10000);
    };
    // Si el mapa no está inicializado, lo inicializamos y comenzamos a obtener los aviones
    // Si el mapa ya está inicializado, simplemente comenzamos a obtener los aviones
    if (!mapInstance.current) {
      initMap().then(startFetching);
    } else {
      startFetching();
    }
    // Limpiamos el intervalo al desmontar el componente
    // Utilizamos useEffect para limpiar el intervalo al desmontar el componente
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pais]);

  useEffect(() => {
    if (!mapInstance.current || !userPos) return;
    // Si el mapa no está inicializado o la posición del usuario no está disponible, no hacemos nada
    // Si ya existe un círculo de usuario, lo eliminamos antes de crear uno nuevo
    if (userCircle.current) {
      userCircle.current.remove();
    }
    // Si el círculo de usuario ya existe, lo eliminamos antes de crear uno nuevo
    // Creamos un nuevo círculo alrededor de la posición del usuario con el radio especificado
    const L = window.L || mapInstance.current._leaflet;
    userCircle.current = L.circle(userPos, {
      radius: radio * 1000,
      color: "#3388ff",
      fillColor: "#3388ff",
      fillOpacity: 0.2,
    }).addTo(mapInstance.current);

    let cuenta = 0;
    // Contamos cuántos aviones están dentro del radio especificado
    avionesVisibles.forEach((avion) => {
      if (
        avion.lat &&
        avion.lon &&
        distancia(userPos[0], userPos[1], avion.lat, avion.lon) <= radio
      ) {
        cuenta++;
      }
    });
    setAvionesCerca(cuenta);
  }, [avionesVisibles, radio, userPos]);
  // Renderizamos el componente del mapa con el panel lateral y los controles
  return (
    <div className="flex h-screen overflow-hidden relative font-sans bg-gray-100 text-gray-800">
      {/* Panel lateral */}
      <aside
        className={`${
          infoVisible ? "w-80" : "w-0"
        } transition-width duration-300 h-full overflow-hidden bg-white dark:bg-border border-r ${
          infoVisible ? "border-gray-300 shadow-md" : "border-none"
        } relative flex flex-col select-none`}
      >
        {infoVisible && (
          <>
            {/* Botón para ocultar, dentro del panel */}
            <button
              onClick={() => setInfoVisible(false)}
              aria-label="Ocultar panel"
              title="Ocultar panel"
              className="absolute top-3 right-3 bg-transparent border-none text-xl font-bold cursor-pointer text-gray-600 dark:text-light p-0 leading-none select-none transition-colors duration-200 hover:text-blue-500"
            >
              ‹
            </button>

            {/* Selector de región */}
            <div className="px-6 py-4 border-b border-gray-200 font-semibold text-lg text-gray-900 dark:text-light">
              Región:&nbsp;
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 outline-none cursor-pointer bg-gray-100 text-gray-800"
              >
                {/* Mapeamos las regiones disponibles para crear las opciones del select */}
                {regionesDisponibles.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Contenido scrollable */}
            <div className="px-6 py-4 overflow-y-auto flex-1 text-sm leading-relaxed text-gray-700">
              <label
                htmlFor="input-radio"
                className="flex items-center mb-4 font-semibold text-gray-800 dark:text-light"
              >
                Radio (km):
                <input
                  id="input-radio"
                  type="number"
                  min="1"
                  max="1000"
                  value={radio}
                  onChange={(e) => setRadio(Number(e.target.value))}
                  className="w-20 px-3 py-2 ml-3 rounded-md border border-gray-300 text-sm font-medium text-gray-900 bg-white"
                />
              </label>

              <button
                onClick={marcarRadio}
                className="w-full py-2 bg-blue-500 border-none rounded-lg text-white font-semibold text-sm cursor-pointer select-none shadow-md transition-colors duration-200 hover:bg-blue-700"
              >
                Marcar radio con mi ubicación
              </button>
              {/* Mostrar número de aviones dentro del radio */}
              {userPos && (
                <div className="mt-4 font-semibold text-gray-900 dark:text-light text-center text-sm">
                  <span>Aviones dentro del radio: </span>
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-base inline-block">
                    {avionesCerca}
                  </span>
                </div>
              )}

              {/* Tabla resumen aviones */}
              <div className="mt-6">
                <table className="w-full border-collapse text-sm text-gray-700 dark:text-light">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-light">
                        País
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-light">
                        Hex
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-light">
                        Altitud (ft)
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-light">
                        Vel. (kt)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {avionesVisibles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-3 text-center text-gray-500"
                        >
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      avionesVisibles.map((avion, idx) => (
                        <tr
                          key={`${avion.hex}-${idx}`}
                          className="border-b border-gray-200 dark:border-background transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <td className="px-3 py-2 flex items-center">
                            <img
                              src={`./paises/${avion.pais}.png`}
                              alt={avion.pais}
                              className="w-5 h-4 mr-2 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            {avion.pais}
                          </td>
                          <td className="px-3 py-2">{avion.hex}</td>
                          <td className="px-3 py-2">
                            {avion.alt_baro ?? "N/A"}
                          </td>
                          <td className="px-3 py-2">{avion.gs ?? "N/A"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Botón para mostrar el panel si está oculto */}
      {!infoVisible && (
        <button
          onClick={() => setInfoVisible(true)}
          aria-label="Mostrar panel"
          title="Mostrar panel"
          className="absolute top-4 left-0 bg-blue-500 border-none text-white px-3 py-2 rounded-tr-lg rounded-br-lg cursor-pointer text-xl font-semibold z-30 select-none shadow-md transition-colors duration-200 hover:bg-blue-700"
        >
          ›
        </button>
      )}

      {/* Contenedor mapa */}
      <div
        ref={mapRef}
        className="flex-1 h-screen w-full relative overflow-hidden  z-20"
      ></div>
    </div>
  );
};

export default MapaAviones;
