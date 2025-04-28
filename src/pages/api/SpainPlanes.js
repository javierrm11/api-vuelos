// src/pages/api/espana.js (o en functions)

export async function GET() {
    // Coordenadas aproximadas del centro de España (Madrid) y un radio razonable
    const lat = 40.4168;
    const lon = -3.7038;
    const radius = 250; // en km, puedes ajustarlo si quieres más o menos cobertura
  
    const res = await fetch(`https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${radius}`);
    const data = await res.json();
  
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
  
    // Procesar los aviones
    const aviones = data.ac.map(avion => ({
      hex: avion.hex,
      velocidad: avion.gs || 0 // gs = ground speed (velocidad en tierra). Puede ser null o 0.
    }));
  
    // Ordenar por velocidad para encontrar el más rápido y el más lento
    const avionesOrdenados = [...aviones].sort((a, b) => b.velocidad - a.velocidad);
    
    const masRapido = avionesOrdenados[0];
    const masLento = avionesOrdenados[avionesOrdenados.length - 1];
  
    const respuesta = {
      pais: "España",
      aviones: aviones.map(a => a.hex),
      masRapido: { hex: masRapido.hex, velocidad: masRapido.velocidad },
      masLento: { hex: masLento.hex, velocidad: masLento.velocidad }
    };
  
    return new Response(JSON.stringify(respuesta), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  