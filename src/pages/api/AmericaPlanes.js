export const dynamic = 'force-dynamic';

const paisesAmericanos = [
    { nombre: "Estados Unidos - Noroeste", lat: 47.6062, lon: -122.3321 }, // Seattle
    { nombre: "Estados Unidos - Suroeste", lat: 34.0522, lon: -118.2437 }, // Los Ángeles
    { nombre: "Estados Unidos - Medio Oeste", lat: 41.8781, lon: -87.6298 }, // Chicago
    { nombre: "Estados Unidos - Atlántico Medio", lat: 39.9526, lon: -75.1652 }, // Filadelfia
    { nombre: "Estados Unidos - Sureste", lat: 25.7617, lon: -80.1918 }, // Miami
    { nombre: "Canadá - Este", lat: 45.4215, lon: -75.6972 }, // Ottawa
    { nombre: "México - Centro", lat: 19.4326, lon: -99.1332 }, // Ciudad de México
    { nombre: "Brasil", lat: -14.235, lon: -51.9253 },
    { nombre: "Argentina", lat: -38.4161, lon: -63.6167 },
    { nombre: "Colombia", lat: 4.5709, lon: -74.2973 },
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function GET() {
    try {
        const resultados = [];

        for (const pais of paisesAmericanos) {
            const response = await fetch(
                `https://api.adsb.lol/v2/lat/${pais.lat}/lon/${pais.lon}/dist/250`
            );

            let data;
            try {
                data = await response.json();
            } catch (error) {
                resultados.push({ pais: pais.nombre, error: "Error al procesar la respuesta del servidor." });
                continue;
            }

            if (!data.ac || data.ac.length === 0) {
                resultados.push({ pais: pais.nombre, error: "No se encontraron aviones en la zona." });
                continue;
            }

            const avionesVolando = data.ac.filter((avion) => (avion.gs || 0) > 0);

            if (avionesVolando.length === 0) {
                resultados.push({ pais: pais.nombre, error: "No hay aviones volando en la zona." });
                continue;
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

            resultados.push({
                pais: pais.nombre,
                aviones: avionesVolando.map((avion) => avion.hex),
                avionesInfo,
                masRapido,
                masLento,
            });

            await delay(300); // Espera de 300ms entre cada país
        }

        const exitosos = resultados.filter((res) => !res.error);

        const todosAviones = exitosos.flatMap((res) => res.aviones);
        const avionesInfo = exitosos.flatMap((res) => res.avionesInfo);

        const masRapidoDeAmerica = exitosos
            .map((res) => res.masRapido)
            .sort((a, b) => b.velocidad - a.velocidad)[0];

        const masLentoDeAmerica = exitosos
            .map((res) => res.masLento)
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
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Surrogate-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Error general al procesar la solicitud." }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}