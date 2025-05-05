// /src/pages/api/SpainPlanes.js
export const dynamic = 'force-dynamic';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

export async function GET() {
  try {
    const response = await fetch(
      `https://api.adsb.lol/v2/lat/40.4168/lon/-3.7038/dist/250`
    );
    let data;
    try {
      data = await response.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Error al procesar la respuesta del servidor." }),
        { status: 500, headers: defaultHeaders }
      );
    }

    if (!data.ac?.length) {
      return new Response(
        JSON.stringify({ error: "No se encontraron aviones en la zona." }),
        { status: 404, headers: defaultHeaders }
      );
    }

    const avionesVolando = data.ac.filter(av => (av.gs || 0) > 0);
    if (!avionesVolando.length) {
      return new Response(
        JSON.stringify({ error: "No hay aviones volando en la zona." }),
        { status: 404, headers: defaultHeaders }
      );
    }

    const masRapido = avionesVolando.reduce((a, b) => (b.gs > a.gs ? b : a), avionesVolando[0]);
    const masLento  = avionesVolando.reduce((a, b) => (b.gs < a.gs ? b : a), avionesVolando[0]);

    const avionesHexT = avionesVolando.map(av => ({ hex: av.hex, t: av.t }));
    const avionesInfo = avionesVolando.map(av => ({
      hex: av.hex,
      gs: av.gs,
      alt_baro: av.alt_baro,
      lat: av.lat,
      lon: av.lon,
      track: av.track,
    }));
    

    return new Response(
      JSON.stringify({
        pais: "España",
        masRapido: { hex: masRapido.hex, velocidad: masRapido.gs },
        masLento:  { hex: masLento.hex,  velocidad: masLento.gs },
        aviones:        avionesHexT,
        avionesInfo     // Ahora incluye también lat y lon
      }),
      { status: 200, headers: defaultHeaders }
    );    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al realizar la solicitud al servidor." }),
      { status: 500, headers: defaultHeaders }
    );
  }
}
