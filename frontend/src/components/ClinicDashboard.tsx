import { useState, useEffect, useCallback } from 'react';
import { clinicService } from '../services/api';
import ClinicAgenda from './ClinicAgenda';
import ClinicPatients from './ClinicPatients';
import ClinicBilling from './ClinicBilling';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NavTab = 'agenda' | 'pacientes' | 'facturacion' | 'configuracion';

interface ClinicInfo {
  id: number;
  name: string;
  email: string;
  referralCode: string;
}

interface Psychologist {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid #e5e7eb',
        borderTopColor: '#5a9270',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '80px auto',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Nav item
// ---------------------------------------------------------------------------
function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        width: '100%',
        padding: '10px 0',
        border: 'none',
        background: active ? '#f0f5f3' : 'transparent',
        borderRight: active ? '3px solid #5a9270' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: active ? 700 : 500,
          color: active ? '#5a9270' : '#6b7280',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Config placeholder
// ---------------------------------------------------------------------------
function ConfigPlaceholder() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#6b7280',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 48 }}>⚙️</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Configuración</div>
      <div style={{ fontSize: 14 }}>Próximamente</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ClinicDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>('agenda');
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Inject keyframe
  if (typeof document !== 'undefined' && !document.getElementById('clinic-dash-spin')) {
    const style = document.createElement('style');
    style.id = 'clinic-dash-spin';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [me, psychs] = await Promise.all([
        clinicService.getMe(),
        clinicService.getPsychologists(),
      ]);
      setClinicInfo(me);
      setPsychologists(psychs);
    } catch {
      // If backend not yet available, show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  const handleCopyReferral = () => {
    if (clinicInfo?.referralCode) {
      navigator.clipboard.writeText(clinicInfo.referralCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* ---- Left sidebar ---- */}
      <aside
        style={{
          width: 72,
          minWidth: 72,
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '100%',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#5a9270',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.5px',
            }}
          >
            G
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, width: '100%', paddingTop: 8 }}>
          <NavItem icon="📅" label="Agenda" active={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')} />
          <NavItem icon="👥" label="Pacientes" active={activeTab === 'pacientes'} onClick={() => setActiveTab('pacientes')} />
          <NavItem icon="💰" label="Facturación" active={activeTab === 'facturacion'} onClick={() => setActiveTab('facturacion')} />
          <NavItem icon="⚙️" label="Config" active={activeTab === 'configuracion'} onClick={() => setActiveTab('configuracion')} />
        </div>

        {/* Bottom: user avatar */}
        <div
          style={{
            width: '100%',
            padding: '12px 0',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#e5e7eb',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {clinicInfo ? initials(clinicInfo.name) : '?'}
          </div>
          <span
            style={{
              fontSize: 9,
              color: '#9ca3af',
              textAlign: 'center',
              maxWidth: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 4px',
            }}
          >
            {clinicInfo?.name ?? ''}
          </span>
        </div>
      </aside>

      {/* ---- Main area ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header
          style={{
            height: 60,
            minHeight: 60,
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 5,
          }}
        >
          {/* Left: company name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
              {clinicInfo?.name ?? 'Clínica'}
            </span>
            {clinicInfo?.referralCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Código de empresa:</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#5a9270',
                    background: '#f0f5f3',
                    padding: '2px 8px',
                    borderRadius: 6,
                    letterSpacing: '0.05em',
                  }}
                >
                  {clinicInfo.referralCode}
                </span>
                <button
                  onClick={handleCopyReferral}
                  title="Copiar código"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: copied ? '#5a9270' : '#9ca3af',
                    padding: '2px 4px',
                    transition: 'color 0.2s',
                  }}
                >
                  {copied ? '✓' : '⎘'}
                </button>
              </div>
            )}
          </div>

          {/* Right: logout */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              color: '#374151',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cerrar sesión
          </button>
        </header>

        {/* Content area */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {activeTab === 'agenda' && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ClinicAgenda psychologists={psychologists} />
                </div>
              )}
              {activeTab === 'pacientes' && (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <ClinicPatients />
                </div>
              )}
              {activeTab === 'facturacion' && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <ClinicBilling psychologists={psychologists} />
                </div>
              )}
              {activeTab === 'configuracion' && (
                <div style={{ flex: 1 }}>
                  <ConfigPlaceholder />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
