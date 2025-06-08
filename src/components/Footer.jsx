export default function Footer() {
    return (
      <footer className="lg:pl-64 bottom-0 bg-secondary dark:bg-border text-text text-center py-3 z-50 shadow-md">
        <p className="text-sm">
          @ {new Date().getFullYear()} ApiVuelos - Todos los derechos reservados.
        </p>
      </footer>
    );
  }