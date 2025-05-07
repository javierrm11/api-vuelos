export const dynamic = 'force-dynamic';

const paisesOceanicos = [
    { nombre: "Australia", lat: -25.2744, lon: 133.7751 },
    { nombre: "Nueva Zelanda", lat: -40.9006, lon: 174.886 },
    { nombre: "Papúa Nueva Guinea", lat: -6.314993, lon: 143.95555 },
    { nombre: "Fiyi", lat: -17.7134, lon: 178.065 },
    { nombre: "Samoa", lat: -13.759, lon: -172.1046 },
    { nombre: "Tonga", lat: -21.179, lon: -175.1982 },
    { nombre: "Vanuatu", lat: -15.3767, lon: 166.9592 },
    { nombre: "Islas Salomón", lat: -9.6457, lon: 160.1562 },
    { nombre: "Micronesia", lat: 7.4256, lon: 150.5508 },
    { nombre: "Kiribati", lat: 1.8709, lon: -157.363 },
    { nombre: "Islas Marshall", lat: 7.1315, lon: 171.1845 },
    { nombre: "Palau", lat: 7.51498, lon: 134.5825 },
    // Agrega más países o territorios según sea necesario
];

export async function GET() {
    try {
        const resultados = await Promise.all(
            paisesOceanicos.map(async (pais) => {
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

                const avionesInfo = avionesVolando.map((av) => ({
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

                return {
                    pais: pais.nombre,
                    aviones: avionesVolando.map((avion) => avion.hex),
                    avionesInfo,
                    masRapido,
                    masLento,
                };
            })
        );

        const todosAviones = resultados
            .filter((resultado) => !resultado.error)
            .flatMap((resultado) => resultado.aviones);

        const avionesInfo = resultados
            .filter((resultado) => !resultado.error)
            .flatMap((resultado) => resultado.avionesInfo);

        const masRapidoDeOceania = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masRapido)
            .sort((a, b) => b.velocidad - a.velocidad)[0];

        const masLentoDeOceania = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masLento)
            .sort((a, b) => a.velocidad - b.velocidad)[0];

        return new Response(
            JSON.stringify({
                todosAviones,
                avionesInfo,
                masRapidoDeOceania,
                masLentoDeOceania,
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