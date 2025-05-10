export const dynamic = 'force-dynamic';

import { GET as EuropaPlanes } from './EuropaPlanes';
import { GET as AsiaPlanes } from './AsiaPlanes';
import { GET as AmericaPlanes } from './AmericaPlanes';
import { GET as AfricaPlanes } from './AfricaPlanes';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function GET() {
    try {
        const continentes = [
            { nombre: "Europa", handler: EuropaPlanes },
            { nombre: "Asia", handler: AsiaPlanes },
            { nombre: "América", handler: AmericaPlanes },
            { nombre: "África", handler: AfricaPlanes },
        ];

        const resultados = [];

        for (const continente of continentes) {
            try {
                const response = await continente.handler();
                const data = await response.json();

                resultados.push({
                    continente: continente.nombre,
                    todosAviones: data.todosAviones,
                    avionesInfo: data.avionesInfo,
                    masRapido: data.masRapidoDeEuropa || data.masRapidoDeAsia || data.masRapidoDeAmerica || data.masRapidoDeAfrica,
                    masLento: data.masLentoDeEuropa || data.masLentoDeAsia || data.masLentoDeAmerica || data.masLentoDeAfrica,
                });

                await delay(300); // Espera de 300ms entre cada continente
            } catch (error) {
                resultados.push({ continente: continente.nombre, error: "Error al procesar la solicitud del continente." });
            }
        }

        const exitosos = resultados.filter((res) => !res.error);

        const todosAviones = exitosos.flatMap((res) => res.todosAviones);
        const avionesInfo = exitosos.flatMap((res) => res.avionesInfo);

        const masRapidoGlobal = exitosos
            .map((res) => res.masRapido)
            .sort((a, b) => b.velocidad - a.velocidad)[0];

        const masLentoGlobal = exitosos
            .map((res) => res.masLento)
            .sort((a, b) => a.velocidad - b.velocidad)[0];

        return new Response(
            JSON.stringify({
                todosAviones,
                avionesInfo,
                masRapidoGlobal,
                masLentoGlobal,
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
            JSON.stringify({ error: "Error general al procesar la solicitud global." }),
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