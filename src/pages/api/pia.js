// src/pages/api/pia.js o en functions según config de Astro
export async function GET() {
    // Esta función maneja la solicitud GET a la API de pia
    // Realiza una solicitud a la API externa y devuelve los datos en formato JSON
    const res = await fetch('https://api.adsb.lol/v2/pia');
    const data = await res.json();
    // Verificamos si la respuesta es exitosa
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }