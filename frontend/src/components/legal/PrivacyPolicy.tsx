interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen" style={{ background: '#f5f7f6', color: '#1a2e22' }}>
      {/* Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(90, 146, 112, 0.15)',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#3a5a4a',
            fontSize: '15px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            transition: 'color 0.3s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5a9270'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#3a5a4a'; }}
        >
          &larr; Volver
        </button>
        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: '#5a9270',
            letterSpacing: '-0.02em',
          }}
        >
          Gantly
        </div>
        <div style={{ width: '80px' }} />
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div
          style={{
            background: '#ffffff',
            border: '2px solid rgba(90, 146, 112, 0.15)',
            borderRadius: '24px',
            padding: '56px',
            boxShadow: '0 8px 24px rgba(26, 46, 34, 0.08)',
          }}
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <h1
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '36px',
                fontWeight: 700,
                color: '#1a2e22',
                letterSpacing: '-0.02em',
                margin: '0 0 12px',
              }}
            >
              Politica de Privacidad
            </h1>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                color: '#5a9270',
                fontWeight: 500,
                margin: 0,
              }}
            >
              Ultima actualizacion: 1 de marzo de 2026
            </p>
          </div>

          {/* Introduction */}
          <Section title="1. Introduccion">
            <p>
              En Gantly (en adelante, "la Plataforma"), operada por Gantly Health S.L.
              (en adelante, "el Responsable"), nos comprometemos a proteger la
              privacidad y los datos personales de nuestros usuarios. Esta Politica de
              Privacidad describe como recopilamos, utilizamos, almacenamos y protegemos
              su informacion personal de conformidad con el Reglamento General de
              Proteccion de Datos (RGPD - Reglamento UE 2016/679) y la Ley Organica
              3/2018, de 5 de diciembre, de Proteccion de Datos Personales y garantia de
              los derechos digitales (LOPDGDD).
            </p>
          </Section>

          <Section title="2. Responsable del tratamiento">
            <InfoBlock
              items={[
                { label: 'Razon social', value: 'Gantly Health S.L.' },
                { label: 'Domicilio', value: 'Madrid, Espana' },
                { label: 'Correo electronico', value: 'privacidad@gantly.es' },
                { label: 'Delegado de Proteccion de Datos (DPO)', value: 'dpo@gantly.es' },
              ]}
            />
          </Section>

          <Section title="3. Datos que recopilamos">
            <p>Recopilamos las siguientes categorias de datos personales:</p>
            <SubSection title="3.1. Datos de identificacion">
              <BulletList
                items={[
                  'Nombre completo, direccion de correo electronico y contrasena (cifrada)',
                  'Datos de perfil: foto de perfil (opcional), fecha de nacimiento, genero',
                  'Datos de autenticacion a traves de Google OAuth2 (si se utiliza)',
                ]}
              />
            </SubSection>
            <SubSection title="3.2. Datos de salud (categoria especial)">
              <BulletList
                items={[
                  'Resultados de tests psicologicos (personalidad, evaluaciones clinicas)',
                  'Registros del diario de estado de animo (mood_rating, emociones, actividades)',
                  'Historial de citas y sesiones terapeuticas',
                  'Mensajes de chat con profesionales (cifrados con AES-256-GCM)',
                  'Tareas terapeuticas asignadas y su seguimiento',
                ]}
              />
              <HighlightBox>
                El tratamiento de datos de salud se realiza con base en su
                consentimiento explicito (art. 9.2.a RGPD) y para la prestacion de
                asistencia sanitaria (art. 9.2.h RGPD).
              </HighlightBox>
            </SubSection>
            <SubSection title="3.3. Datos tecnicos">
              <BulletList
                items={[
                  'Direccion IP, tipo de navegador, sistema operativo',
                  'Datos de uso de la plataforma y registros de actividad (logs de auditoria)',
                  'Tokens de sesion y datos de autenticacion',
                ]}
              />
            </SubSection>
            <SubSection title="3.4. Datos financieros">
              <BulletList
                items={[
                  'Informacion de pago procesada a traves de Stripe (no almacenamos datos de tarjetas; Stripe actua como procesador de pagos certificado PCI-DSS)',
                ]}
              />
            </SubSection>
          </Section>

          <Section title="4. Finalidades del tratamiento">
            <p>Sus datos personales son tratados para las siguientes finalidades:</p>
            <NumberedList
              items={[
                'Prestacion del servicio: gestion de cuentas, emparejamiento con profesionales, gestion de citas y sesiones de videollamada.',
                'Evaluacion psicologica: administracion de tests, generacion de resultados y seguimiento terapeutico.',
                'Comunicacion segura: mensajeria cifrada entre pacientes y profesionales.',
                'Mejora del servicio: analisis estadisticos anonimizados sobre el uso de la plataforma.',
                'Facturacion y pagos: gestion de suscripciones y procesamiento de pagos a traves de Stripe.',
                'Obligaciones legales: cumplimiento de normativas sanitarias y de proteccion de datos.',
                'Gestion de consentimiento: especialmente para usuarios menores de edad, gestion de autorizaciones parentales.',
              ]}
            />
          </Section>

          <Section title="5. Base legal del tratamiento">
            <p>
              El tratamiento de sus datos se fundamenta en las siguientes bases
              juridicas:
            </p>
            <BulletList
              items={[
                'Consentimiento (art. 6.1.a y 9.2.a RGPD): para el tratamiento de datos de salud y el uso de cookies no esenciales.',
                'Ejecucion de contrato (art. 6.1.b RGPD): para la prestacion de los servicios contratados.',
                'Obligacion legal (art. 6.1.c RGPD): para el cumplimiento de normativas sanitarias y fiscales.',
                'Interes legitimo (art. 6.1.f RGPD): para la seguridad de la plataforma, prevencion de fraude y mejora del servicio.',
              ]}
            />
          </Section>

          <Section title="6. Politica de cookies">
            <p>Gantly utiliza las siguientes categorias de cookies:</p>
            <SubSection title="6.1. Cookies esenciales">
              <p>
                Necesarias para el funcionamiento de la plataforma: tokens de sesion JWT,
                preferencias de idioma y configuracion de seguridad. No requieren
                consentimiento.
              </p>
            </SubSection>
            <SubSection title="6.2. Cookies funcionales">
              <p>
                Almacenan preferencias del usuario como el idioma seleccionado y la
                configuracion del panel de usuario. Se activan con su consentimiento.
              </p>
            </SubSection>
            <SubSection title="6.3. Cookies analiticas">
              <p>
                Utilizadas para recopilar datos estadisticos anonimos sobre el uso de la
                plataforma. Se activan unicamente con su consentimiento previo.
              </p>
            </SubSection>
            <HighlightBox>
              Puede gestionar sus preferencias de cookies en cualquier momento desde la
              configuracion de su cuenta o a traves del banner de cookies al acceder a la
              plataforma.
            </HighlightBox>
          </Section>

          <Section title="7. Conservacion de datos">
            <p>
              Los datos personales se conservan durante los siguientes periodos:
            </p>
            <BulletList
              items={[
                'Datos de cuenta: mientras la cuenta este activa y hasta 30 dias tras la solicitud de eliminacion.',
                'Datos de salud: durante la relacion terapeutica y hasta 5 anos despues de su finalizacion, conforme a la normativa sanitaria espanola (Ley 41/2002).',
                'Datos de facturacion: 5 anos conforme a la normativa fiscal.',
                'Registros de auditoria: 2 anos desde su generacion.',
                'Datos anonimizados: pueden conservarse de forma indefinida al no constituir datos personales.',
              ]}
            />
          </Section>

          <Section title="8. Destinatarios de los datos">
            <p>
              Sus datos personales pueden ser comunicados a los siguientes destinatarios:
            </p>
            <BulletList
              items={[
                'Profesionales de la salud mental: psicologos asignados a traves de la plataforma, quienes acceden unicamente a los datos necesarios para la prestacion del servicio.',
                'Procesadores de pago: Stripe, Inc. (certificado PCI-DSS) para el procesamiento de pagos.',
                'Proveedores de infraestructura: servicios de alojamiento y base de datos.',
                'Autoridades competentes: cuando sea requerido por ley o resolucion judicial.',
              ]}
            />
            <p>
              No realizamos transferencias internacionales de datos fuera del Espacio
              Economico Europeo (EEE) sin las garantias adecuadas conforme al RGPD.
            </p>
          </Section>

          <Section title="9. Derechos del usuario">
            <p>
              De conformidad con el RGPD y la LOPDGDD, usted tiene los siguientes
              derechos:
            </p>
            <NumberedList
              items={[
                'Derecho de acceso: obtener confirmacion de si se tratan sus datos y acceder a los mismos.',
                'Derecho de rectificacion: solicitar la correccion de datos inexactos o incompletos.',
                'Derecho de supresion ("derecho al olvido"): solicitar la eliminacion de sus datos cuando ya no sean necesarios.',
                'Derecho de limitacion: solicitar la restriccion del tratamiento en determinadas circunstancias.',
                'Derecho de portabilidad: recibir sus datos en un formato estructurado, de uso comun y lectura mecanica.',
                'Derecho de oposicion: oponerse al tratamiento de sus datos en determinadas circunstancias.',
                'Derecho a retirar el consentimiento: en cualquier momento, sin que afecte a la licitud del tratamiento previo.',
                'Derecho a no ser objeto de decisiones automatizadas: incluida la elaboracion de perfiles con efectos juridicos.',
              ]}
            />
            <HighlightBox>
              Para ejercer cualquiera de estos derechos, puede enviar un correo
              electronico a{' '}
              <strong>privacidad@gantly.es</strong> o a nuestro DPO en{' '}
              <strong>dpo@gantly.es</strong>, adjuntando copia de su documento de
              identidad. Responderemos en un plazo maximo de 30 dias.
            </HighlightBox>
          </Section>

          <Section title="10. Seguridad de los datos">
            <p>
              Implementamos medidas tecnicas y organizativas para proteger sus datos
              personales:
            </p>
            <BulletList
              items={[
                'Cifrado de mensajes de chat con AES-256-GCM.',
                'Contrasenas almacenadas con hash seguro (BCrypt).',
                'Autenticacion mediante tokens JWT con expiracion limitada.',
                'Filtros de limitacion de velocidad (rate limiting) para prevenir ataques.',
                'Registros de auditoria para el seguimiento de accesos y operaciones sensibles.',
                'Protocolos HTTPS/TLS para todas las comunicaciones.',
                'Copias de seguridad periodicas y cifradas de la base de datos.',
              ]}
            />
          </Section>

          <Section title="11. Menores de edad">
            <p>
              La plataforma puede ser utilizada por menores de 14 anos unicamente con el
              consentimiento verificable de sus padres, tutores o representantes legales.
              Gantly implementa un sistema de gestion de consentimiento parental que
              incluye:
            </p>
            <BulletList
              items={[
                'Solicitudes de consentimiento dirigidas a los representantes legales.',
                'Verificacion de la identidad del tutor o representante.',
                'Gestion de documentos de consentimiento firmados.',
                'Posibilidad de revocacion del consentimiento en cualquier momento.',
              ]}
            />
          </Section>

          <Section title="12. Reclamaciones">
            <p>
              Si considera que el tratamiento de sus datos personales vulnera la
              normativa vigente, tiene derecho a presentar una reclamacion ante la
              Agencia Espanola de Proteccion de Datos (AEPD):
            </p>
            <InfoBlock
              items={[
                { label: 'Web', value: 'www.aepd.es' },
                { label: 'Direccion', value: 'C/ Jorge Juan, 6, 28001 Madrid' },
                { label: 'Telefono', value: '901 100 099' },
              ]}
            />
          </Section>

          <Section title="13. Modificaciones de esta politica">
            <p>
              Nos reservamos el derecho de modificar esta Politica de Privacidad en
              cualquier momento. Las modificaciones seran notificadas a traves de la
              plataforma y/o por correo electronico. Le recomendamos revisar esta
              politica periodicamente.
            </p>
          </Section>

          {/* Footer */}
          <div
            className="mt-12 pt-8 text-center"
            style={{
              borderTop: '1px solid rgba(90, 146, 112, 0.15)',
            }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#5a9270',
                margin: 0,
              }}
            >
              Gantly Health S.L. - Todos los derechos reservados
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ──────────────────────────── Reusable sub-components ──────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '22px',
          fontWeight: 700,
          color: '#1a2e22',
          letterSpacing: '-0.01em',
          margin: '0 0 16px',
          paddingBottom: '10px',
          borderBottom: '2px solid rgba(90, 146, 112, 0.15)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          lineHeight: 1.8,
          color: '#3a5a4a',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-4">
      <h3
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '17px',
          fontWeight: 600,
          color: '#2a4a3a',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="pl-6 my-3 space-y-2" style={{ listStyleType: 'disc' }}>
      {items.map((item, i) => (
        <li key={i} style={{ paddingLeft: '4px' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="pl-6 my-3 space-y-2" style={{ listStyleType: 'decimal' }}>
      {items.map((item, i) => (
        <li key={i} style={{ paddingLeft: '4px' }}>
          {item}
        </li>
      ))}
    </ol>
  );
}

function InfoBlock({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div
      className="my-4 p-5 rounded-xl"
      style={{
        background: 'rgba(90, 146, 112, 0.06)',
        border: '1px solid rgba(90, 146, 112, 0.15)',
      }}
    >
      {items.map((item, i) => (
        <p key={i} className="my-1" style={{ margin: '6px 0' }}>
          <strong style={{ color: '#1a2e22' }}>{item.label}:</strong>{' '}
          {item.value}
        </p>
      ))}
    </div>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-4 p-5 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(90, 146, 112, 0.08), rgba(91, 143, 168, 0.06))',
        borderLeft: '4px solid #5a9270',
        fontStyle: 'normal',
      }}
    >
      {children}
    </div>
  );
}
