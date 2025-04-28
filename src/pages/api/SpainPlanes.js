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

      // Filtramos los aviones que tienen velocidad mayor a 0
      const avionesVolando = data.ac.filter(avion => (avion.gs || 0) > 0);

      if (avionesVolando.length === 0) {
        return new Response(
          JSON.stringify({ error: "No hay aviones volando en la zona." }),
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
        aviones: avionesVolando.map(avion => avion.hex),
        masRapido: avionesVolando
          .map(avion => ({ hex: avion.hex, velocidad: avion.gs }))
          .sort((a, b) => b.velocidad - a.velocidad)[0],
        masLento: avionesVolando
          .map(avion => ({ hex: avion.hex, velocidad: avion.gs }))
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
