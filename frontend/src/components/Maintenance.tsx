export default function Maintenance() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-[80px] text-sage/40 mb-6 block">
          construction
        </span>
        <h1 className="text-3xl font-light text-forest mb-4">
          Estamos en mantenimiento
        </h1>
        <p className="text-sage/70 text-lg mb-8 leading-relaxed">
          Estamos realizando mejoras para ofrecerte una mejor experiencia. Vuelve en unos minutos.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-forest text-white rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
