import { useState, useEffect } from 'react';
import { stripeService } from '../services/api';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  invoicePdf?: string | null;
}

export default function BillingPortal() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  async function loadPaymentHistory() {
    try {
      setLoading(true);
      setError(null);
      const data = await stripeService.getPaymentHistory();
      setPayments(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar el historial de pagos');
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    try {
      setPortalLoading(true);
      const { url } = await stripeService.createBillingPortal();
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al abrir el portal de facturacion');
    } finally {
      setPortalLoading(false);
    }
  }

  function formatAmount(amount: number, currency: string): string {
    const value = amount / 100;
    if (currency.toLowerCase() === 'eur') {
      return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
    }
    return value.toLocaleString('es-ES', { style: 'currency', currency: currency.toUpperCase() });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[0.8rem] font-semibold capitalize bg-green-100 text-green-800">Pagado</span>
        );
      case 'pending':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[0.8rem] font-semibold capitalize bg-yellow-100 text-yellow-800">Pendiente</span>
        );
      case 'failed':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[0.8rem] font-semibold capitalize bg-red-100 text-red-800">Fallido</span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[0.8rem] font-semibold capitalize bg-gray-100 text-gray-700">{status}</span>
        );
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 font-body">
      <h1 className="text-[1.75rem] font-heading font-bold text-gantly-navy mb-6">Facturacion</h1>

      {error && (
        <div className="bg-red-50 text-red-800 rounded-lg px-4 py-3 mb-6 text-[0.95rem]">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h2 className="text-[1.1rem] font-heading font-semibold text-gray-700 mt-0 mb-4">Suscripcion</h2>
        <p className="text-gantly-muted mt-0 mb-4 text-[0.95rem]">
          Gestiona tu suscripcion, metodo de pago y datos de facturacion desde el portal de Stripe.
        </p>
        <button
          className="bg-gantly-blue text-white border-none rounded-lg px-6 py-3 text-base font-semibold font-body cursor-pointer hover:bg-gantly-blue-600 transition-colors disabled:bg-gantly-blue/50 disabled:cursor-not-allowed"
          onClick={handleManageSubscription}
          disabled={portalLoading}
        >
          {portalLoading ? 'Abriendo portal...' : 'Gestionar suscripcion'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-[1.1rem] font-heading font-semibold text-gray-700 mt-0 mb-4">Historial de pagos</h2>

        {loading ? (
          <div className="text-center py-12 text-gantly-blue text-base">Cargando historial de pagos...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="m-0 text-base">No hay pagos registrados todavia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 border-b-2 border-gray-200 text-[0.85rem] font-semibold text-gantly-blue uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 border-b-2 border-gray-200 text-[0.85rem] font-semibold text-gantly-blue uppercase tracking-wider">Importe</th>
                  <th className="text-left px-4 py-3 border-b-2 border-gray-200 text-[0.85rem] font-semibold text-gantly-blue uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 border-b-2 border-gray-200 text-[0.85rem] font-semibold text-gantly-blue uppercase tracking-wider">Factura</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 border-b border-gray-100 text-[0.95rem] text-gray-700">{formatDate(payment.date)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-[0.95rem] text-gray-700">{formatAmount(payment.amount, payment.currency)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-[0.95rem] text-gray-700">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-[0.95rem] text-gray-700">
                      {payment.invoicePdf ? (
                        <a
                          href={payment.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gantly-blue font-medium no-underline hover:underline"
                        >
                          Descargar PDF
                        </a>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
