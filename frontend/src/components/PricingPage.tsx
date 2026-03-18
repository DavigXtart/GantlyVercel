import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Pricing, PricingPlan } from './ui/pricing';
import { toast } from './ui/Toast';

const plans: PricingPlan[] = [
  {
    name: 'Básico',
    price: '29',
    yearlyPrice: '23',
    period: 'mes',
    features: [
      'Chat con tu psicólogo',
      '2 videollamadas al mes',
      'Tareas terapéuticas',
      'Tests de evaluación',
    ],
    description: 'Ideal para empezar tu proceso terapéutico.',
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
      'Todo lo del plan Básico',
      '4 videollamadas al mes',
      'Sesiones de grupo',
      'Informes de progreso',
      'Soporte prioritario',
    ],
    description: 'El plan más completo para tu bienestar.',
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
      'Panel de administración',
      'Gestión de empleados',
      'Métricas de bienestar',
      'Facturación centralizada',
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
      toast.success('Suscripción activada correctamente');
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
    <div className="min-h-screen bg-cream">
      <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <h3
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', userSelect: 'none', margin: 0 }}
        >
          Gantly
        </h3>
        <button
          onClick={() => onBack ? onBack() : navigate(-1)}
          className="btn-secondary"
        >
          Volver
        </button>
      </nav>
      <Pricing
        plans={plans}
        title="Planes de suscripción"
        description="Elige el plan que mejor se ajuste a tus necesidades.&#10;Todos los planes incluyen acceso completo a la plataforma."
      />
    </div>
  );
}
