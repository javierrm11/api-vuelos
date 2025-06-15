import DarkModeToggleMovile from "./DarkModeToogleMovile";
//
export default function Header({ onMenuClick, isOpen }) {
    return (
        // Componente de encabezado
        // Este componente muestra un encabezado con un botón de menú, un logo y un botón de modo oscuro
        <header className="lg:hidden flex justify-between items-center p-4 bg-gray-800 text-white fixed top-0 w-full z-50">
            {
                /* Botón de menú */
                /* Este botón alterna el estado del menú y cambia su icono según el estado */
            }
            <button onClick={onMenuClick}>
                {isOpen ? (
                    // ICONO X
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    // ICONO BURGER
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>
            {/* Logo */}
            <div className="text-lg font-bold">
                <img src="./logo/__Isotipo negativo.png" alt="Logo" className="h-10 object-contain" />
            </div>
            {/* Botón de modo oscuro */}
                <DarkModeToggleMovile />
        </header>
    );
}
