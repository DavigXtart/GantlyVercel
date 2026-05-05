import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { stripeService } from "@/services/api";

export interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href?: string;
  onClick?: () => void;
  isPopular: boolean;
  planId?: string; // ID del plan para Stripe (ej: "basic", "premium", "enterprise")
  useStripe?: boolean; // Si es true, usa Stripe para el checkout
}

export interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Planes de prueba",
  description = "Elige el plan que mejor se ajuste a tus necesidades\nTodos los planes incluyen caracteristicas de prueba para evaluar el servicio.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleStripeCheckout = async (plan: PricingPlan) => {
    if (!plan.planId) {
      return;
    }

    setLoading(plan.planId);
    try {
      const response = await stripeService.createCheckoutSession(
        plan.planId,
        !isMonthly
      );
      // Redirigir a Stripe Checkout
      window.location.href = response.url;
    } catch (error) {
      alert("Error al procesar el pago. Por favor, intenta de nuevo.");
      setLoading(null);
    }
  };

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "#2E93CC",
          "#22D3EE",
          "#F0C930",
          "#059669",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="py-20 px-4 max-w-[1400px] mx-auto">
      <div className="text-center space-y-4 mb-16 px-4">
        <h2 className="text-4xl font-heading font-bold tracking-tight sm:text-5xl lg:text-6xl text-gantly-navy">
          {title}
        </h2>
        <p className="text-gantly-muted text-lg lg:text-xl whitespace-pre-line max-w-3xl mx-auto font-body">
          {description}
        </p>
      </div>

      <div className="flex justify-center mb-16">
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold font-body text-gantly-text">
          Facturacion anual <span className="text-gantly-blue">(Ahorra 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 lg:px-8">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -24 : index === 1 ? 0 : 24,
                    opacity: 1,
                    scale: index === 0 || index === 2 ? 0.92 : 1.0,
                  }
                : {
                    y: 0,
                    opacity: 1,
                  }
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.4,
              type: "spring",
              stiffness: 80,
              damping: 25,
              delay: 0.2 + index * 0.2,
              opacity: { duration: 0.7 },
            }}
            className={cn(
              `rounded-2xl p-8 lg:p-10 bg-white text-center flex flex-col justify-center relative transition-all duration-300 shadow-card`,
              plan.isPopular ? "border-2 border-gantly-gold shadow-elevated ring-1 ring-gantly-gold/20" : "border border-gray-200",
              "min-h-[580px] lg:min-h-[650px]",
              index === 0 || index === 2 ? "z-0 lg:mt-12" : "z-10",
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-gantly-gold py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center">
                <Star className="text-white h-4 w-4 fill-current" />
                <span className="text-white ml-1 font-body font-semibold text-sm">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-gantly-muted font-body">
                {plan.name}
              </p>
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-gantly-navy font-heading">
                  <NumberFlow
                    value={
                      isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)
                    }
                    format={{
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                    className="font-variant-numeric: tabular-nums"
                  />
                </span>
                {plan.period !== "Next 3 months" && (
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gantly-muted font-body">
                    / {plan.period}
                  </span>
                )}
              </div>

              <p className="text-xs leading-5 text-gantly-muted font-body mt-1">
                {isMonthly ? "facturado mensualmente" : "facturado anualmente"}
              </p>

              <ul className="mt-5 gap-2 flex flex-col">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gantly-blue mt-1 flex-shrink-0" />
                    <span className="text-left text-gantly-text font-body">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4 border-gray-200" />

              {plan.useStripe && plan.planId ? (
                <button
                  onClick={() => handleStripeCheckout(plan)}
                  disabled={loading === plan.planId}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    }),
                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter font-body",
                    "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-gantly-blue hover:ring-offset-1 hover:bg-gantly-blue hover:text-white",
                    plan.isPopular
                      ? "bg-gantly-blue text-white border-gantly-blue"
                      : "bg-white text-gantly-navy border-gray-300",
                    loading === plan.planId && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading === plan.planId ? "Procesando..." : plan.buttonText}
                </button>
              ) : plan.onClick ? (
                <button
                  onClick={plan.onClick}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    }),
                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter font-body",
                    "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-gantly-blue hover:ring-offset-1 hover:bg-gantly-blue hover:text-white",
                    plan.isPopular
                      ? "bg-gantly-blue text-white border-gantly-blue"
                      : "bg-white text-gantly-navy border-gray-300"
                  )}
                >
                  {plan.buttonText}
                </button>
              ) : (
                <a
                  href={plan.href || "#"}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    }),
                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter font-body",
                    "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-gantly-blue hover:ring-offset-1 hover:bg-gantly-blue hover:text-white",
                    plan.isPopular
                      ? "bg-gantly-blue text-white border-gantly-blue"
                      : "bg-white text-gantly-navy border-gray-300"
                  )}
                >
                  {plan.buttonText}
                </a>
              )}
              <p className="mt-6 text-xs leading-5 text-gantly-muted font-body">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
