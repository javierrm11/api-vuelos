import { useState, useEffect } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const links = [
    { label: 'Inicio', href: '/' },
    { label: 'Spain', href: '/Spain' },
    { label: 'Europa', href: '/Europa' },
    { label: 'Africa', href: '/Africa' },
    { label: 'America', href: '/America' },
    { label: 'Asia', href: '/Asia' },
    { label: 'Oceania', href: '/Oceania' },
    { label: 'Mapa', href: '/Mapa' },
    { label: 'Disclaimer', href: '/Legal' },
  ];

  return (
    <aside
      className={`
        fixed top-15 left-0 h-full w-64 bg-gray-900 text-white z-40 transition-transform transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:flex lg:h-screen lg:top-0
      `}
    >
      <div className="flex flex-col w-full">
        {/* 👤 Usuario (solo desktop) */}
        <div className="hidden lg:flex flex-col items-center py-10 pb-10 bg-blue-900 border-b border-gray-700">
          <img
            src="/usuario.jpg" // ← cambia esto por tu imagen
            alt="Usuario"
            className="w-20 h-20 rounded-full object-cover mb-2"
          />
          <span className="text-white font-semibold">Nombre Usuario</span>
        </div>

        {/* 🌍 Navegación */}
        <nav className="flex flex-col p-6 space-y-6">
          {links.map(({ label, href }) => {
            const isActive = currentPath === href;
            return (
<a
  key={href}
  href={href}
  onClick={onClose}
  className={`
    text-lg px-6 lg:w-54 w-30 py-2 ml-4
    transition-all duration-300 ease-in-out
    rounded-xl lg:rounded-l-xl
    ${isActive
      ? 'bg-gray-200 text-black animate-fadeIn'
      : 'bg-transparent text-white hover:bg-gray-200 hover:text-black'}
  `}
>
  {label}
</a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
