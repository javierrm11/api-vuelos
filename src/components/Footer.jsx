export default function Footer() {
  // Componente de pie de página
  // Este componente muestra un pie de página con el año actual y un mensaje de derechos reservados
  // Utilizamos la fecha actual para mostrar el año dinámicamente
  // El pie de página tiene un fondo secundario y un texto centrado
    return (
      <footer className="lg:pl-64 bottom-0 bg-secondary dark:bg-border text-text text-center py-3 z-50 shadow-md">
        <p className="text-sm">
          @ {new Date().getFullYear()} ApiVuelos - Todos los derechos reservados.
        </p>
      </footer>
    );
  }