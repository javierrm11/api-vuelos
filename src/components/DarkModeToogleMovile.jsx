import { useEffect, useState } from "react";
import { FaRegSun, FaMoon  } from "react-icons/fa";

export default function DarkModeToggleMovile() {
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
      className="flex items-center justify-center bg-primary p-3 rounded-full shadow-lg  dark:text-white hover:scale-105 transition-all duration-300"
    >
      {isDark ? (
        <>
          <FaMoon  className="animate-fly-left" />
        </>
      ) : (
        <>
          <FaRegSun className="animate-fly-right text-light" />

        </>
      )}
    </button>
  );
}
