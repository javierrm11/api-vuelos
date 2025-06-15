import { useState, useEffect } from "react";
import  DarkModeToggle from "./DarkModeToogle.jsx"; // Asegúrate de que la ruta sea correcta

// Componente Sidebar que muestra un menú de navegación lateral
// Este componente utiliza useState y useEffect para manejar el estado del menú y la ruta actual
export default function Sidebar({ isOpen, onClose }) {
  // Estado para almacenar la ruta actual
  // Este estado se actualiza al cargar el componente para reflejar la ruta actual del navegador
  // Utilizamos useEffect para sincronizar el estado con la ruta actual
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const links = [
    { label: "Inicio", href: "/" },
    { label: "España", href: "/Spain" },
    { label: "Europa", href: "/Europa" },
    { label: "Africa", href: "/Africa" },
    { label: "America", href: "/America" },
    { label: "Asia", href: "/Asia" },
    { label: "Oceania", href: "/Oceania" },
    { label: "Mapa", href: "/Mapa" },
    { label: "Disclaimer", href: "/Legal" },
  ];

  return (
    // Componente Sidebar que muestra un menú de navegación lateral
    // Este componente utiliza clases de Tailwind CSS para el estilo y la animación
    <div
      className={`
        fixed top-15 left-0 h-full w-full sm:w-64 lg:w-64 bg-nav text-light z-40 transition-transform transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:fixed lg:flex md:h-screen lg:top-0
      `}
    >
      <div className="flex flex-col w-full lg:h-screen">
        {/* 👤 Usuario (solo desktop) */}
        <div className="hidden lg:flex flex-col items-center py-10 pb-10 bg-primary border-b border-gray-700">
          <DarkModeToggle />
          <img
            src="./logo/__Marca principal en negativo.png" // ← cambia esto por tu imagen
            alt="Usuario"
            className="h-55 object-contain p-3"
          />
          <span className="font-bold text-2xl">ApiVuelos</span>
        </div>

        {/* 🌍 Navegación */}
        <nav className="flex flex-col py-6 pl-6 pb-6 space-y-6">
          {links.map(({ label, href }) => {
            const isActive = currentPath === href;
            return (
              <a
              key={href}
              href={href}
              onClick={onClose}
              className={`
        text-lg px-6 w-full py-1
        transition-all duration-300 ease-in-out
        rounded-l-xl
        ${
          isActive
          ? "bg-background text-accent animate-fadeIn"
          : "bg-transparent text-border dark:text-light hover:bg-background hover:text-accent"
        }
        `}
              >
              {label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
