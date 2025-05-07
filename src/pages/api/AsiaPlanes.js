export const dynamic = 'force-dynamic';

const paisesAsiaticos = [
    { nombre: "China", lat: 35.8617, lon: 104.1954 },
    { nombre: "India", lat: 20.5937, lon: 78.9629 },
    { nombre: "Japón", lat: 36.2048, lon: 138.2529 },
    { nombre: "Rusia", lat: 61.524, lon: 105.3188 },
    { nombre: "Indonesia", lat: -0.7893, lon: 113.9213 },
    { nombre: "Pakistán", lat: 30.3753, lon: 69.3451 },
    { nombre: "Bangladés", lat: 23.685, lon: 90.3563 },
    { nombre: "Arabia Saudita", lat: 23.8859, lon: 45.0792 },
    { nombre: "Irán", lat: 32.4279, lon: 53.688 },
    { nombre: "Turquía", lat: 38.9637, lon: 35.2433 },
    { nombre: "Corea del Sur", lat: 35.9078, lon: 127.7669 },
    { nombre: "Vietnam", lat: 14.0583, lon: 108.2772 },
    { nombre: "Filipinas", lat: 12.8797, lon: 121.774 },
    { nombre: "Tailandia", lat: 15.870, lon: 100.9925 },
    { nombre: "Malasia", lat: 4.2105, lon: 101.9758 },
    { nombre: "Kazajistán", lat: 48.0196, lon: 66.9237 },
    { nombre: "Irak", lat: 33.2232, lon: 43.6793 },
    { nombre: "Afganistán", lat: 33.9391, lon: 67.71 },
    { nombre: "Uzbekistán", lat: 41.3775, lon: 64.5853 },
    { nombre: "Sri Lanka", lat: 7.8731, lon: 80.7718 },
    // Agrega más países según sea necesario
];

export async function GET() {
    try {
        const resultados = await Promise.all(
            paisesAsiaticos.map(async (pais) => {
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

        const masRapidoDeAsia = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masRapido)
            .sort((a, b) => b.velocidad - a.velocidad)[0];

        const masLentoDeAsia = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masLento)
            .sort((a, b) => a.velocidad - b.velocidad)[0];

        return new Response(
            JSON.stringify({
                todosAviones,
                avionesInfo,
                masRapidoDeAsia,
                masLentoDeAsia,
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