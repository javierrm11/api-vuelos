export default function Header({ onMenuClick, isOpen }) {
    return (
        <header className="lg:hidden flex justify-between items-center p-4 bg-gray-800 text-white fixed top-0 w-full z-50">
            <button onClick={onMenuClick}>
                {isOpen ? (
                    // ICONO X
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    // ICONO BURGER
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>
            <div className="text-lg font-bold">MiLogo</div>
        </header>
    );
}
