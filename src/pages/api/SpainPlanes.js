// src/pages/api/espana.js (o en functions)

export async function GET() {
  return fetch(`https://api.adsb.lol/v2/lat/40.4168/lon/-3.7038/dist/250`)
    .then(res => res.json())
    .then(data => {
      if (!data.ac || data.ac.length === 0) {
        return new Response(
          JSON.stringify({ error: "No se encontraron aviones en la zona." }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      return new Response(JSON.stringify({
        pais: "España",
        aviones: data.ac.map(avion => avion.hex),
        masRapido: data.ac
          .map(avion => ({ hex: avion.hex, velocidad: avion.gs || 0 }))
          .sort((a, b) => b.velocidad - a.velocidad)[0],
        masLento: data.ac
          .map(avion => ({ hex: avion.hex, velocidad: avion.gs || 0 }))
          .sort((a, b) => b.velocidad - a.velocidad)
          .slice(-1)[0],
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    });
}
