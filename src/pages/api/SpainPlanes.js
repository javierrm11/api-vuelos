export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(`https://api.adsb.lol/v2/lat/40.4168/lon/-3.7038/dist/250`);
    let data;

    try {
      data = await response.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Error al procesar la respuesta del servidor." }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
          },
        }
      );
    }

    if (!data.ac || data.ac.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron aviones en la zona." }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
          },
        }
      );
    }

    const avionesVolando = data.ac.filter(avion => (avion.gs || 0) > 0);
    const avionesInfo = avionesVolando.map(av => ({
      hex: av.hex,
      gs: av.gs,
      alt_baro: av.alt_baro,
      lat: av.lat,
      lon: av.lon,
      track: av.track,
    }));

    if (avionesVolando.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay aviones volando en la zona." }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store',
          },
        }
      );
    }

    const masRapido = avionesVolando
      .map(avion => ({ hex: avion.hex, velocidad: avion.gs }))
      .sort((a, b) => b.velocidad - a.velocidad)[0];

    const masLento = avionesVolando
      .map(avion => ({ hex: avion.hex, velocidad: avion.gs }))
      .sort((a, b) => a.velocidad - b.velocidad)[0];

    return new Response(
      JSON.stringify({
        pais: "España",
        aviones: avionesVolando.map(avion => avion.hex),
        avionesInfo,
        masRapido,
        masLento,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al realizar la solicitud al servidor." }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  }
}
