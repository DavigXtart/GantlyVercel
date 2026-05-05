export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gantly-cloud flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-[80px] text-gantly-blue/40 mb-6 block">
          construction
        </span>
        <h1 className="text-3xl font-heading font-light text-gantly-navy mb-4">
          Estamos en mantenimiento
        </h1>
        <p className="text-gantly-muted text-lg mb-8 leading-relaxed font-body">
          Estamos realizando mejoras para ofrecerte una mejor experiencia. Vuelve en unos minutos.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gantly-blue text-white rounded-xl text-sm font-medium font-body hover:bg-gantly-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
