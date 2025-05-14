export const dynamic = 'force-dynamic';

import elecciones from './array'; // Importar el array con las coordenadas de países y continentes

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region'); // Obtener el parámetro 'region' de la URL

  if (!region || !elecciones[region]) {
    return new Response(
      JSON.stringify({ error: "Región no válida o no especificada." }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const seleccion = elecciones[region]; // Obtener las coordenadas de la región seleccionada
  const resultados = [];

  try {
    for (const ubicacion of seleccion) {
      const response = await fetch(
        `https://api.adsb.lol/v2/lat/${ubicacion.lat}/lon/${ubicacion.lon}/dist/250`
      );

      let data;
      try {
        data = await response.json();
      } catch (error) {
        resultados.push({ ubicacion: ubicacion.nombre, error: "Error al procesar la respuesta del servidor." });
        continue;
      }

      if (!data.ac || data.ac.length === 0) {
        resultados.push({ ubicacion: ubicacion.nombre, error: "No se encontraron aviones en la zona." });
        continue;
      }

      const avionesVolando = data.ac.filter((avion) => (avion.gs || 0) > 0);

      if (avionesVolando.length === 0) {
        resultados.push({ ubicacion: ubicacion.nombre, error: "No hay aviones volando en la zona." });
        continue;
      }

      const avionesInfo = avionesVolando.map((av) => ({
        pais: ubicacion.nombre,
        hex: av.hex,
        gs: av.gs,
        alt_baro: av.alt_baro,
        lat: av.lat,
        lon: av.lon,
        track: av.track,
      }));

      const masRapido = avionesVolando
        .map((avion) => ({ hex: avion.hex, velocidad: avion.gs }))
        .sort((a, b) => b.velocidad - a.velocidad)[0];

      const masLento = avionesVolando
        .map((avion) => ({ hex: avion.hex, velocidad: avion.gs }))
        .sort((a, b) => a.velocidad - b.velocidad)[0];

      resultados.push({
        ubicacion: ubicacion.nombre,
        aviones: avionesVolando.map((avion) => avion.hex),
        avionesInfo,
        masRapido,
        masLento,
      });
    }

    return new Response(
      JSON.stringify(resultados),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error general al procesar la solicitud." }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}