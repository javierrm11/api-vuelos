import { useEffect, useRef, useState } from "react";

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

  const obtenerAviones = async () => {
    try {
      if (pais === "Global") {
        const regiones = ["Europa", "America", "Asia", "Africa", "Oceania"];
        const resultados = await Promise.all(
          regiones.map(async (region) => {
            const response = await fetch(`/api/planes?region=${region}`);
            const data = await response.json();
            if (data.error) return [];
            return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
          })
        );
        return resultados.flat();
      } else {
        const response = await fetch(`/api/planes?region=${pais}`);
        const data = await response.json();
        if (data.error) {
          console.error(`Error al obtener aviones para ${pais}:`, data.error);
          return [];
        }
        return data.flatMap((ubicacion) => ubicacion.avionesInfo || []);
      }
    } catch (error) {
      console.error(`Error al realizar la solicitud para ${pais}:`, error);
      return [];
    }
  };

  const generarIconoPorAltitud = (alt_baro) => {
    let color = "#00cc44";
    if (alt_baro <= 10000) color = "#ff0000";
    else if (alt_baro <= 30000) color = "#ffaa00";

    const svgHTML = `
      <svg width="32" height="32" viewBox="-0.8 -0.8 17.60 17.60" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0L6 2V5L0 9V11H1L6 10L7 13L5 14V16H11V14L9 13L10 10L15 11H16V9L10 5V2L9 0H7Z" fill="${color}" stroke="black" stroke-width="0.5"/>
      </svg>
    `;

    return L.divIcon({
      html: svgHTML,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const updateMarkers = (aviones) => {
    const nuevosHex = new Set(aviones.map((av) => av.hex));

    for (const [hex, marker] of markersMap.current.entries()) {
      if (!nuevosHex.has(hex)) {
        marker.remove();
        markersMap.current.delete(hex);
      }
    }

    aviones.forEach((avion) => {
      const { hex, lat, lon, t, flight, pais, track, alt_baro, gs } = avion;
      const iconoDinamico = generarIconoPorAltitud(alt_baro || 0);

      if (markersMap.current.has(hex)) {
        const marker = markersMap.current.get(hex);
        marker.setLatLng([lat, lon]);
        marker.setRotationAngle(track || 0);
        marker.setIcon(iconoDinamico);
      } else {
        const marker = L.marker([lat, lon], {
          icon: iconoDinamico,
          rotationAngle: track || 0,
          rotationOrigin: "center center",
        }).addTo(mapInstance.current);

        marker.bindPopup(`
          <div style="font-size: 14px; line-height: 1.3; max-width: 220px;">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <b style="margin-right: 6px;">País:</b> 
              <img src="./paises/${
                avion.pais
              }.png" alt="bandera" style="width: 18px; height: 12px; margin-left: 4px;"/>
            </div>
            <div><b>Hex:</b> ${hex}</div>
            <div><b>Vuelo:</b> ${flight || "N/A"}</div>
            <div><b>Tipo:</b> ${t || "N/A"}</div>
            <div><b>Velocidad:</b> ${gs} kt</div>
            <div><b>Altitud:</b> ${alt_baro} ft</div>
            <div><b>Rumbo:</b> ${track || "N/A"}°</div>
          </div>
        `);

        markersMap.current.set(hex, marker);
      }
    });

    setAvionesVisibles(aviones.sort((a, b) => (b.gs || 0) - (a.gs || 0)));
  };

  const distancia = (lat1, lon1, lat2, lon2) => {
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

  useEffect(() => {
    let intervalId;

    const initMap = async () => {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      await import("leaflet-rotatedmarker");

      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current).setView([40.4168, -3.7038], 6);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserPos([latitude, longitude]);
            map.setView([latitude, longitude], 8);

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

    const startFetching = async () => {
      const aviones = await obtenerAviones();
      updateMarkers(aviones);

      intervalId = setInterval(async () => {
        const nuevosAviones = await obtenerAviones();
        updateMarkers(nuevosAviones);
      }, 10000);
    };

    if (!mapInstance.current) {
      initMap().then(startFetching);
    } else {
      startFetching();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pais]);

  useEffect(() => {
    if (!mapInstance.current || !userPos) return;

    if (userCircle.current) {
      userCircle.current.remove();
    }

    const L = window.L || mapInstance.current._leaflet;
    userCircle.current = L.circle(userPos, {
      radius: radio * 1000,
      color: "#3388ff",
      fillColor: "#3388ff",
      fillOpacity: 0.2,
    }).addTo(mapInstance.current);

    let cuenta = 0;
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
