export const dynamic = 'force-dynamic';

const paisesAfricanos = [
    { nombre: "Sudáfrica", lat: -30.5595, lon: 22.9375 },
    { nombre: "Nigeria", lat: 9.082, lon: 8.6753 },
    { nombre: "Egipto", lat: 26.8206, lon: 30.8025 },
    { nombre: "Argelia", lat: 28.0339, lon: 1.6596 },
    { nombre: "Etiopía", lat: 9.145, lon: 40.4897 },
    { nombre: "Kenia", lat: -1.286389, lon: 36.817223 },
    { nombre: "Ghana", lat: 7.9465, lon: -1.0232 },
    { nombre: "Marruecos", lat: 31.7917, lon: -7.0926 },
    { nombre: "Túnez", lat: 33.8869, lon: 9.5375 },
    { nombre: "Angola", lat: -11.2027, lon: 17.8739 },
    { nombre: "Mozambique", lat: -18.6657, lon: 35.5296 },
    { nombre: "Senegal", lat: 14.4974, lon: -14.4524 },
    { nombre: "Sudán", lat: 12.8628, lon: 30.2176 },
    { nombre: "Uganda", lat: 1.3733, lon: 32.2903 },
    { nombre: "Zambia", lat: -13.1339, lon: 27.8493 },
    // Agrega más países según sea necesario
];

export async function GET() {
    try {
        const resultados = await Promise.all(
            paisesAfricanos.map(async (pais) => {
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

        const masRapidoDeAfrica = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masRapido)
            .sort((a, b) => b.velocidad - a.velocidad)[0];

        const masLentoDeAfrica = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masLento)
            .sort((a, b) => a.velocidad - b.velocidad)[0];

        return new Response(
            JSON.stringify({
                todosAviones,
                avionesInfo,
                masRapidoDeAfrica,
                masLentoDeAfrica,
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