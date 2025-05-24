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
  const [infoVisible, setInfoVisible] = useState(true);

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
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: '#f5f7fa',
        color: '#333',
      }}
    >
      {/* Panel lateral */}
      <aside
        style={{
          width: infoVisible ? 320 : 0,
          transition: 'width 0.35s ease',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          borderRight: infoVisible ? '1px solid #ddd' : 'none',
          boxShadow: infoVisible ? '2px 0 12px rgba(0,0,0,0.07)' : 'none',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          zIndex: 1000,
        }}
      >
        {infoVisible && (
          <>
            {/* Botón para ocultar, dentro del panel */}
            <button
              onClick={() => setInfoVisible(false)}
              aria-label="Ocultar panel"
              title="Ocultar panel"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#666',
                padding: 0,
                lineHeight: 1,
                userSelect: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#007bff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#666')}
            >
              ‹
            </button>

            {/* Selector de región */}
            <div
              style={{
                padding: '16px 24px 8px 24px',
                borderBottom: '1px solid #eee',
                fontWeight: '600',
                fontSize: 16,
                color: '#222',
              }}
            >
              Región:&nbsp;
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: 15,
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa',
                  color: '#333',
                }}
              >
                {regionesDisponibles.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Contenido scrollable */}
            <div
              style={{
                padding: '16px 24px',
                overflowY: 'auto',
                flex: 1,
                fontSize: 14,
                lineHeight: 1.5,
                color: '#444',
              }}
            >
              <label
                htmlFor="input-radio"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                Radio (km):
                <input
                  id="input-radio"
                  type="number"
                  min="1"
                  max="1000"
                  value={radio}
                  onChange={(e) => setRadio(Number(e.target.value))}
                  style={{
                    width: '70px',
                    padding: '6px 10px',
                    marginLeft: '12px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#222',
                    backgroundColor: '#fff',
                  }}
                />
              </label>

              <button
                onClick={marcarRadio}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  backgroundColor: '#007bff',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 15,
                  cursor: 'pointer',
                  userSelect: 'none',
                  boxShadow: '0 4px 8px rgb(0 123 255 / 0.3)',
                  transition: 'background-color 0.25s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
              >
                Marcar radio con mi ubicación
              </button>

              {userPos && (
                <div
                  style={{
                    marginTop: '18px',
                    fontWeight: '600',
                    color: '#222',
                    textAlign: 'center',
                    fontSize: 15,
                  }}
                >
                  <span>Aviones dentro del radio: </span>
                  <span
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: '700',
                      fontSize: 16,
                      minWidth: 40,
                      display: 'inline-block',
                    }}
                  >
                    {avionesCerca}
                  </span>
                </div>
              )}

              {/* Tabla resumen aviones */}
              <div style={{ marginTop: '24px' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    color: '#444',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ccc' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#222' }}>
                        País
                      </th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#222' }}>
                        Hex
                      </th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#222' }}>
                        Altitud (ft)
                      </th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '600', color: '#222' }}>
                        Vel. (kt)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {avionesVisibles.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      avionesVisibles.map((avion, idx) => (
                        <tr
                          key={`${avion.hex}-${idx}`}
                          style={{
                            borderBottom: '1px solid #eee',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f8ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '8px 10px', verticalAlign: 'middle', display: 'flex', alignItems: 'center' }}>
                            <img
                              src={`./paises/${avion.pais}.png`}
                              alt={avion.pais}
                              style={{ width: 20, height: 14, marginRight: 8, objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {avion.pais}
                          </td>
                          <td style={{ padding: '8px 10px' }}>{avion.hex}</td>
                          <td style={{ padding: '8px 10px' }}>{avion.alt_baro ?? 'N/A'}</td>
                          <td style={{ padding: '8px 10px' }}>{avion.gs ?? 'N/A'}</td>
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
          style={{
            position: 'absolute',
            top: 16,
            left: 0,
            background: '#007bff',
            border: 'none',
            color: 'white',
            padding: '6px 10px',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            cursor: 'pointer',
            fontSize: 20,
            fontWeight: '600',
            zIndex: 1100,
            userSelect: 'none',
            boxShadow: '0 4px 8px rgba(0,123,255,0.3)',
            transition: 'background-color 0.25s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
        >
          ›
        </button>
      )}

            {/* Contenedor mapa */}
            <div
              ref={mapRef}
              style={{
                flex: 1,
                height: '100vh',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#e4e9f0',
              }}
            ></div>
          </div>
        );
      };

export default MapaAviones;
