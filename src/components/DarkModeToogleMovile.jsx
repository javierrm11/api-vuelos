import { useEffect, useState } from "react";
import { FaRegSun, FaMoon  } from "react-icons/fa";
import { LuSun }  from "react-icons/lu";
// Importa los iconos de react-icons
// Componente para alternar entre modo oscuro y claro en dispositivos móviles
export default function DarkModeToggleMovile() {

  // Utilizamos useState para manejar el estado del modo oscuro
  // Utilizamos useEffect para sincronizar el estado con localStorage
  // Evitamos el parpadeo inicial con un estado de montaje

  const [isDark, setIsDark] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Inicializamos el estado de montaje
  // Evitamos el parpadeo inicial con un estado de montaje

  useEffect(() => {
    const root = window.document.documentElement;
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    root.classList.toggle("dark", dark);
    setHasMounted(true);
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
  // Evitamos renderizar hasta que esté montado
  if (!hasMounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center bg-primary p-3 rounded-full shadow-lg  dark:text-white hover:scale-105 transition-all duration-300"
    >
      {/*Botón para alternar entre modo oscuro y claro*/}
      {/*Utilizamos iconos de react-icons para mostrar una animación al cambiar de modo*/}
      {/*Los iconos tienen clases de animación para volar hacia la izquierda o derecha*/}
      {isDark ? (
        <>
          <FaMoon  className="animate-fly-left" />
        </>
      ) : (
        <>
          <LuSun className="animate-fly-right text-light" />
        </>
      )}
    </button>
  );
}
