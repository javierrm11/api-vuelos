import { useEffect, useState } from "react";
import { FaPlaneDeparture, FaPlaneArrival } from "react-icons/fa";
// Importa los iconos de react-icons

// Componente para alternar entre modo oscuro y claro
export default function DarkModeToggle() {
  // Utilizamos useState para manejar el estado del modo oscuro
  // Utilizamos useEffect para sincronizar el estado con localStorage
  // Evitamos el parpadeo inicial con un estado de montaje
  const [isDark, setIsDark] = useState(false);
  const [hasMounted, setHasMounted] = useState(false); // <- nuevo
  // Inicializamos el estado de montaje
  useEffect(() => {
    // Verificamos el tema guardado en localStorage y aplicamos la clase correspondiente
    // También aplicamos la clase al elemento raíz del documento
    const root = window.document.documentElement;
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    root.classList.toggle("dark", dark);
    setHasMounted(true); // <- marcamos como montado
  }, []);
  // Función para alternar el modo oscuro
  // Cambiamos la clase del elemento raíz y actualizamos localStorage
  const toggleDarkMode = () => {
    const root = window.document.documentElement;
    const newDark = !isDark;
    root.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    setIsDark(newDark);
  };

  // 🔒 Evitamos renderizar hasta que esté montado
  if (!hasMounted) return null;

  return (
    // Botón para alternar entre modo oscuro y claro
    // Utilizamos iconos de react-icons para mostrar una animación al cambiar de modo
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center gap-2 px-5 py-2 min-w-[180px] rounded-full shadow-lg bg-blue-100 dark:bg-sky-900 text-sky-900 dark:text-white hover:scale-105 transition-all duration-300"
    >
      {/* Utilizamos los iconos de react-icons para mostrar una animación al cambiar de modo */}
      {/* Los iconos tienen clases de animación para volar hacia la izquierda o derecha */}
      {isDark ? (
        <>
          <FaPlaneArrival className="animate-fly-left" />
          Modo Claro
        </>
      ) : (
        <>
          <FaPlaneDeparture className="animate-fly-right" />
          Modo Oscuro
        </>
      )}
    </button>
  );
}
