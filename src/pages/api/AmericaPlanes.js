export const dynamic = 'force-dynamic';

const paisesAmericanos = [
    // Estados Unidos dividido en más regiones
    { nombre: "Estados Unidos - Noroeste", lat: 47.6062, lon: -122.3321 }, // Seattle
    { nombre: "Estados Unidos - Suroeste", lat: 34.0522, lon: -118.2437 }, // Los Ángeles
    { nombre: "Estados Unidos - Medio Oeste", lat: 41.8781, lon: -87.6298 }, // Chicago
    { nombre: "Estados Unidos - Atlántico Medio", lat: 39.9526, lon: -75.1652 }, // Filadelfia
    { nombre: "Estados Unidos - Sureste", lat: 25.7617, lon: -80.1918 }, // Miami
    { nombre: "Estados Unidos - Sur", lat: 29.7604, lon: -95.3698 }, // Houston
    { nombre: "Estados Unidos - Noreste", lat: 40.7128, lon: -74.0060 }, // Nueva York
    { nombre: "Estados Unidos - Montañas Rocosas", lat: 39.7392, lon: -104.9903 }, // Denver
    { nombre: "Estados Unidos - Centro Norte", lat: 44.9778, lon: -93.2650 }, // Minneapolis
    { nombre: "Estados Unidos - Centro Sur", lat: 35.4676, lon: -97.5164 }, // Oklahoma City
    // Canadá y México
    { nombre: "Canadá - Este", lat: 45.4215, lon: -75.6972 }, // Ottawa
    { nombre: "Canadá - Oeste", lat: 53.5461, lon: -113.4938 }, // Edmonton
    { nombre: "México - Norte", lat: 25.6866, lon: -100.3161 }, // Monterrey
    { nombre: "México - Centro", lat: 19.4326, lon: -99.1332 }, // Ciudad de México
    { nombre: "México - Sur", lat: 16.8531, lon: -99.8237 }, // Acapulco
    // Centroamérica
    { nombre: "Guatemala", lat: 15.7835, lon: -90.2308 },
    { nombre: "Honduras", lat: 15.2, lon: -86.2419 },
    { nombre: "El Salvador", lat: 13.7942, lon: -88.8965 },
    { nombre: "Costa Rica", lat: 9.7489, lon: -83.7534 },
    { nombre: "Panamá", lat: 8.537981, lon: -80.782127 },
    // Sudamérica
    { nombre: "Brasil", lat: -14.235, lon: -51.9253 },
    { nombre: "Argentina", lat: -38.4161, lon: -63.6167 },
    { nombre: "Colombia", lat: 4.5709, lon: -74.2973 },
    { nombre: "Chile", lat: -35.6751, lon: -71.543 },
    { nombre: "Perú", lat: -9.19, lon: -75.0152 },
    { nombre: "Venezuela", lat: 6.4238, lon: -66.5897 },
    { nombre: "Ecuador", lat: -1.8312, lon: -78.1834 },
    { nombre: "Bolivia", lat: -16.2902, lon: -63.5887 },
    { nombre: "Paraguay", lat: -23.4425, lon: -58.4438 },
    { nombre: "Uruguay", lat: -32.5228, lon: -55.7658 },
];

export async function GET() {
    try {
        const resultados = await Promise.all(
            paisesAmericanos.map(async (pais) => {
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

        const masRapidoDeAmerica = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masRapido)
            .sort((a, b) => b.velocidad - a.velocidad)[0];

        const masLentoDeAmerica = resultados
            .filter((resultado) => !resultado.error)
            .map((resultado) => resultado.masLento)
            .sort((a, b) => a.velocidad - b.velocidad)[0];

        return new Response(
            JSON.stringify({
                todosAviones,
                avionesInfo,
                masRapidoDeAmerica,
                masLentoDeAmerica,
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