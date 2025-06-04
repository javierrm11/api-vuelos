import { useState, useEffect } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

export default function LayoutWrapper({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        };
        handleResize();

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
