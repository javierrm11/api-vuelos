import { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

export default function LayoutWrapper({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    // 👇 Cierra el sidebar si cambia de ruta o si en desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };

        // Ejecutar al montar
        handleResize();

        // Escuchar resize
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

  return (
    <div className="lg:flex min-h-screen">
      {/* Sidebar (izquierda en desktop) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal */}
      <div className="flex-1">
        <Header onMenuClick={toggleSidebar} isOpen={sidebarOpen} />
        <main className="p-4 pt-20 lg:pt-4 lg:pl-65">{children}</main>
      </div>
    </div>
  );
}
