import { FaGlobeEurope, FaPlane } from 'react-icons/fa';

export default function Loading() {
    // Componente de carga que muestra un planeta y un avión orbitando
    // Este componente utiliza iconos de react-icons para mostrar una animación de carga
    return (
        <div className="h-screen inset-0 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative w-52 h-52">
                    {/* 🌍 Planeta */}
                    <div className="absolute inset-0 spin-more-slow flex items-center justify-center text-accent text-[7rem]">
                        <FaGlobeEurope />
                    </div>

                    {/* ✈️ Avión orbitando */}
                    <div className="absolute w-full h-full spin-slow">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-accent text-xl">
                            <FaPlane />
                        </div>
                    </div>
                </div>

                {/* Texto cargando */}
                <p className="text-accent text-lg animate-pulse">Cargando...</p>
            </div>
        </div>
    );
}
