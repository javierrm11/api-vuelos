const paisesEuropeos = [
    { nombre: "España", lat: 40.4168, lon: -3.7038 },
    { nombre: "Francia", lat: 48.8566, lon: 2.3522 },
    { nombre: "Alemania", lat: 52.52, lon: 13.405 },
    { nombre: "Italia", lat: 41.9028, lon: 12.4964 },
    { nombre: "Reino Unido", lat: 51.5074, lon: -0.1278 },
    { nombre: "Portugal", lat: 38.7169, lon: -9.139 },
    { nombre: "Países Bajos", lat: 52.3676, lon: 4.9041 },
    { nombre: "Bélgica", lat: 50.8503, lon: 4.3517 },
    { nombre: "Suiza", lat: 46.2044, lon: 6.1432 },
    { nombre: "Austria", lat: 48.2082, lon: 16.3738 },
    // Agrega más países según sea necesario
];

export async function GET() {
    const resultados = await Promise.all(
        paisesEuropeos.map(async (pais) => {
            const response = await fetch(
                `https://api.adsb.lol/v2/lat/${pais.lat}/lon/${pais.lon}/dist/250`
            );
            let data;
            try {
                data = await response.json();
            } catch (error) {
                return { pais: pais.nombre, error: "Error al procesar la respuesta del servidor." };
            }

            if (!data.ac || data.ac.length === 0) {
                return { pais: pais.nombre, error: "No se encontraron aviones en la zona." };
            }

            const avionesVolando = data.ac.filter((avion) => (avion.gs || 0) > 0);

            if (avionesVolando.length === 0) {
                return { pais: pais.nombre, error: "No hay aviones volando en la zona." };
            }

            return {
                pais: pais.nombre,
                aviones: avionesVolando.map((avion) => avion.hex),
                masRapido: avionesVolando
                    .map((avion) => ({ hex: avion.hex, velocidad: avion.gs }))
                    .sort((a, b) => b.velocidad - a.velocidad)[0],
                masLento: avionesVolando
                    .map((avion) => ({ hex: avion.hex, velocidad: avion.gs }))
                    .sort((a, b) => b.velocidad - a.velocidad)
                    .slice(-1)[0],
            };
        })
    );

    const todosAviones = resultados
        .filter((resultado) => !resultado.error)
        .flatMap((resultado) => resultado.aviones);

    const avionesConVelocidad = resultados
        .filter((resultado) => !resultado.error)
        .flatMap((resultado) =>
            resultado.aviones.map((_, index) => ({
                hex: resultado.masRapido.hex,
                velocidad: resultado.masRapido.velocidad,
            }))
        );

    const masRapidoDeEuropa = avionesConVelocidad.sort((a, b) => b.velocidad - a.velocidad)[0];
    const masLentoDeEuropa = avionesConVelocidad.sort((a, b) => a.velocidad - b.velocidad)[0];

    return new Response(
        JSON.stringify({
            todosAviones,
            masRapidoDeEuropa,
            masLentoDeEuropa,
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
    );
}