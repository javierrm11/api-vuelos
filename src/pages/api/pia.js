// src/pages/api/pia.js o en functions según config de Astro
export async function GET() {
    const res = await fetch('https://api.adsb.lol/v2/pia');
    const data = await res.json();
  
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }