import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Pricing, PricingPlan } from './ui/pricing';
import { toast } from './ui/Toast';

const plans: PricingPlan[] = [
  {
    name: 'Basico',
    price: '29',
    yearlyPrice: '23',
    period: 'mes',
    features: [
      'Chat con tu psicologo',
      '2 videollamadas al mes',
      'Tareas terapeuticas',
      'Tests de evaluacion',
    ],
    description: 'Ideal para empezar tu proceso terapeutico.',
    buttonText: 'Empezar ahora',
    isPopular: false,
    planId: 'basic',
    useStripe: true,
  },
  {
    name: 'Premium',
    price: '49',
    yearlyPrice: '39',
    period: 'mes',
    features: [
      'Todo lo del plan Basico',
      '4 videollamadas al mes',
      'Sesiones de grupo',
      'Informes de progreso',
      'Soporte prioritario',
    ],
    description: 'El plan mas completo para tu bienestar.',
    buttonText: 'Elegir Premium',
    isPopular: true,
    planId: 'premium',
    useStripe: true,
  },
  {
    name: 'Empresas',
    price: '99',
    yearlyPrice: '79',
    period: 'mes',
    features: [
      'Todo lo del plan Premium',
      'Panel de administracion',
      'Gestion de empleados',
      'Metricas de bienestar',
      'Facturacion centralizada',
    ],
    description: 'Cuida la salud mental de tu equipo.',
    buttonText: 'Contactar',
    isPopular: false,
    planId: 'enterprise',
    useStripe: true,
  },
];

export default function PricingPage({ onBack }: { onBack?: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === 'true') {
      toast.success('Suscripcion activada correctamente');
      searchParams.delete('success');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
    } else if (canceled === 'true') {
      toast.error('El pago fue cancelado');
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gantly-cloud">
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <h3
          onClick={() => navigate('/')}
          className="cursor-pointer select-none m-0 text-2xl font-heading font-bold text-gantly-blue tracking-tight"
        >
          Gantly
        </h3>
        <button
          onClick={() => onBack ? onBack() : navigate(-1)}
          className="px-5 py-2 rounded-full border border-gantly-blue/30 text-gantly-blue font-medium font-body text-sm hover:bg-gantly-blue/5 transition-colors"
        >
          Volver
        </button>
      </nav>
      <Pricing
        plans={plans}
        title="Planes de suscripcion"
        description="Elige el plan que mejor se ajuste a tus necesidades.&#10;Todos los planes incluyen acceso completo a la plataforma."
      />
    </div>
  );
}
