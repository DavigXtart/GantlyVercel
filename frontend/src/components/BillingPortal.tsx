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
      setError(err?.response?.data?.message || 'Error al abrir el portal de facturación');
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
    const base: React.CSSProperties = {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'capitalize',
    };

    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span style={{ ...base, backgroundColor: '#dcfce7', color: '#166534' }}>Pagado</span>
        );
      case 'pending':
        return (
          <span style={{ ...base, backgroundColor: '#fef9c3', color: '#854d0e' }}>Pendiente</span>
        );
      case 'failed':
        return (
          <span style={{ ...base, backgroundColor: '#fee2e2', color: '#991b1b' }}>Fallido</span>
        );
      default:
        return (
          <span style={{ ...base, backgroundColor: '#f3f4f6', color: '#374151' }}>{status}</span>
        );
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      fontFamily: "'Inter', sans-serif",
      maxWidth: 900,
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    heading: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#1f2937',
      marginBottom: '1.5rem',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#374151',
      marginTop: 0,
      marginBottom: '1rem',
    },
    button: {
      backgroundColor: '#5a9270',
      color: '#ffffff',
      border: 'none',
      borderRadius: 8,
      padding: '12px 24px',
      fontSize: '1rem',
      fontWeight: 600,
      fontFamily: "'Inter', sans-serif",
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    buttonDisabled: {
      backgroundColor: '#9cc5ab',
      cursor: 'not-allowed',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      textAlign: 'left' as const,
      padding: '12px 16px',
      borderBottom: '2px solid #e5e7eb',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#5a9270',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.95rem',
      color: '#374151',
    },
    link: {
      color: '#5a9270',
      fontWeight: 500,
      textDecoration: 'none',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '3rem 1rem',
      color: '#9ca3af',
    },
    errorBox: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: '1.5rem',
      fontSize: '0.95rem',
    },
    spinner: {
      textAlign: 'center' as const,
      padding: '3rem 1rem',
      color: '#5a9270',
      fontSize: '1rem',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Facturación</h1>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Suscripción</h2>
        <p style={{ color: '#6b7280', marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem' }}>
          Gestiona tu suscripción, método de pago y datos de facturación desde el portal de Stripe.
        </p>
        <button
          style={{
            ...styles.button,
            ...(portalLoading ? styles.buttonDisabled : {}),
          }}
          onClick={handleManageSubscription}
          disabled={portalLoading}
          onMouseEnter={(e) => {
            if (!portalLoading) (e.currentTarget.style.backgroundColor = '#4a7d5e');
          }}
          onMouseLeave={(e) => {
            if (!portalLoading) (e.currentTarget.style.backgroundColor = '#5a9270');
          }}
        >
          {portalLoading ? 'Abriendo portal...' : 'Gestionar suscripción'}
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Historial de pagos</h2>

        {loading ? (
          <div style={styles.spinner}>Cargando historial de pagos...</div>
        ) : payments.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ margin: 0, fontSize: '1rem' }}>No hay pagos registrados todavía.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Importe</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Factura</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={styles.td}>{formatDate(payment.date)}</td>
                    <td style={styles.td}>{formatAmount(payment.amount, payment.currency)}</td>
                    <td style={styles.td}>{getStatusBadge(payment.status)}</td>
                    <td style={styles.td}>
                      {payment.invoicePdf ? (
                        <a
                          href={payment.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.link}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          Descargar PDF
                        </a>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>--</span>
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
