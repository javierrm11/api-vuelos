export default function Sidebar({ isOpen, onClose }) {
    return (
        <aside
            className={`
    fixed top-15 left-0 h-full w-64 bg-gray-900 text-white z-40 transition-transform transform
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 lg:fixed lg:flex lg:h-screen lg:top-0
    `}
        >
            <nav className="flex flex-col p-6 space-y-4 z-999">
                <a href="/" className="hover:text-gray-300" onClick={onClose}>Inicio</a>
                <a href="/Spain" className="hover:text-gray-300" onClick={onClose}>Spain</a>
                <a href="/Europa" className="hover:text-gray-300" onClick={onClose}>Europa</a>
                <a href="/Africa" className="hover:text-gray-300" onClick={onClose}>Africa</a>
                <a href="/America" className="hover:text-gray-300" onClick={onClose}>America</a>
                <a href="/Asia" className="hover:text-gray-300" onClick={onClose}>Asia</a>
                <a href="/Oceania" className="hover:text-gray-300" onClick={onClose}>Oceania</a>
                <a href="/Mapa" className="hover:text-gray-300" onClick={onClose}>Mapa</a>
            </nav>
        </aside>
    );
}
