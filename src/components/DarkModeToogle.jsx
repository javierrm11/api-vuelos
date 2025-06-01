import { useEffect, useState } from "react";
import { FaPlaneDeparture, FaPlaneArrival } from "react-icons/fa";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [hasMounted, setHasMounted] = useState(false); // <- nuevo

  useEffect(() => {
    const root = window.document.documentElement;
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    root.classList.toggle("dark", dark);
    setHasMounted(true); // <- marcamos como montado
  }, []);

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
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center gap-2 px-5 py-2 min-w-[180px] rounded-full shadow-lg bg-blue-100 dark:bg-sky-900 text-sky-900 dark:text-white hover:scale-105 transition-all duration-300"
    >
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
