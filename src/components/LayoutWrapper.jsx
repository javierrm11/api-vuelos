import { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

// Componente LayoutWrapper que envuelve el contenido principal de la aplicación
// Este componente maneja la lógica de apertura y cierre del sidebar
export default function LayoutWrapper({ children }) {
    // Estado para controlar la apertura del sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Función para alternar el estado del sidebar
    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    // Efecto para cerrar el sidebar al cambiar el tamaño de la ventana
    // Esto asegura que el sidebar se cierre en pantallas grandes
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };
        handleResize();
        // Añadimos un listener para el evento de cambio de tamaño de la ventana
        // Esto asegura que el sidebar se cierre en pantallas grandes
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <>
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Overlay para fondo oscuro en móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-800/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 ">
          <Header onMenuClick={toggleSidebar} isOpen={sidebarOpen} />
          <main className="bg-background pt-15 lg:pt-0 lg:pl-64 lg:m-top-8">{children}</main>
        </div>
      </>
    );
}
