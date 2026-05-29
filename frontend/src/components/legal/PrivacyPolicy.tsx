import SEO from '../seo/SEO';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gantly-cloud text-gantly-text">
      <SEO
        title="Política de privacidad"
        description="Política de privacidad de Gantly. Cumplimiento RGPD, protección de datos de salud (Art. 9), cifrado AES-256 y derechos ARCO."
        path="/privacidad"
      />
      {/* Navigation */}
      <nav className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gantly-blue/10 px-6 md:px-10 py-5 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-gantly-muted text-[15px] font-medium font-body hover:text-gantly-blue transition-colors"
        >
          &larr; Volver
        </button>
        <div className="font-heading text-[28px] font-bold text-gantly-blue tracking-tight">
          Gantly
        </div>
        <div className="w-20" />
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border-2 border-gantly-blue/10 rounded-3xl p-8 md:p-14 shadow-card">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="font-heading text-4xl font-bold text-gantly-navy tracking-tight mb-3">
              Política de Privacidad
            </h1>
            <p className="text-[15px] text-gantly-blue font-medium font-body m-0">
              Última actualización: 10 de mayo de 2026
            </p>
          </div>

          {/* Introduction */}
          <Section title="1. Introducción">
            <p>
              En Gantly (en adelante, "la Plataforma"), operada por Gantly Health S.L.
              (en adelante, "el Responsable"), nos comprometemos a proteger la
              privacidad y los datos personales de nuestros usuarios. Esta Política de
              Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos
              su información personal de conformidad con el Reglamento General de
              Protección de Datos (RGPD - Reglamento UE 2016/679) y la Ley Orgánica
              3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de
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
            <p>Recopilamos las siguientes categorías de datos personales:</p>
            <SubSection title="3.1. Datos de identificación">
              <BulletList
                items={[
                  'Nombre completo, dirección de correo electrónico y contraseña (cifrada)',
                  'Datos de perfil: foto de perfil (opcional), fecha de nacimiento, género',
                  'Datos de autenticación a través de Google OAuth2 (si se utiliza)',
                ]}
              />
            </SubSection>
            <SubSection title="3.2. Datos de salud (categoria especial)">
              <BulletList
                items={[
                  'Resultados de tests psicológicos (personalidad, evaluaciones clínicas)',
                  'Registros del diario de estado de ánimo (mood_rating, emociones, actividades)',
                  'Historial de citas y sesiones terapéuticas',
                  'Mensajes de chat con profesionales (cifrados con AES-256-GCM)',
                  'Tareas terapéuticas asignadas y su seguimiento',
                ]}
              />
              <HighlightBox>
                El tratamiento de datos de salud se realiza con base en su
                consentimiento explícito (art. 9.2.a RGPD) y para la prestación de
                asistencia sanitaria (art. 9.2.h RGPD).
              </HighlightBox>
            </SubSection>
            <SubSection title="3.3. Datos técnicos">
              <BulletList
                items={[
                  'Dirección IP, tipo de navegador, sistema operativo',
                  'Datos de uso de la plataforma y registros de actividad (logs de auditoría)',
                  'Tokens de sesión y datos de autenticación',
                ]}
              />
            </SubSection>
            <SubSection title="3.4. Datos financieros">
              <BulletList
                items={[
                  'Información de pago procesada a través de Stripe (no almacenamos datos de tarjetas; Stripe actúa como procesador de pagos certificado PCI-DSS)',
                ]}
              />
            </SubSection>
          </Section>

          <Section title="4. Finalidades del tratamiento">
            <p>Sus datos personales son tratados para las siguientes finalidades:</p>
            <NumberedList
              items={[
                'Prestación del servicio: gestión de cuentas, emparejamiento con profesionales, gestión de citas y sesiones de videollamada.',
                'Evaluación psicológica: administración de tests, generación de resultados y seguimiento terapéutico.',
                'Comunicación segura: mensajería cifrada entre pacientes y profesionales.',
                'Mejora del servicio: análisis estadísticos anonimizados sobre el uso de la plataforma.',
                'Facturación y pagos: gestión de suscripciones y procesamiento de pagos a través de Stripe.',
                'Obligaciones legales: cumplimiento de normativas sanitarias y de protección de datos.',
                'Gestión de consentimiento: especialmente para usuarios menores de edad, gestión de autorizaciones parentales.',
              ]}
            />
          </Section>

          <Section title="5. Base legal del tratamiento">
            <p>
              El tratamiento de sus datos se fundamenta en las siguientes bases
              jurídicas:
            </p>
            <BulletList
              items={[
                'Consentimiento (art. 6.1.a y 9.2.a RGPD): para el tratamiento de datos de salud y el uso de cookies no esenciales.',
                'Ejecución de contrato (art. 6.1.b RGPD): para la prestación de los servicios contratados.',
                'Obligación legal (art. 6.1.c RGPD): para el cumplimiento de normativas sanitarias y fiscales.',
                'Interés legítimo (art. 6.1.f RGPD): para la seguridad de la plataforma, prevención de fraude y mejora del servicio.',
              ]}
            />

            <SubSection title="5.1. Base legal para datos de salud (Art. 9.2.a RGPD)">
              <p>
                El tratamiento de datos de salud mental (resultados de tests psicológicos,
                diario emocional, historial de sesiones terapéuticas) se realiza exclusivamente
                sobre la base de su <strong>consentimiento explícito</strong>, prestado de forma
                separada durante el proceso de registro. Este consentimiento es libre,
                específico, informado e inequívoco, conforme al Art. 9.2.a del RGPD.
              </p>
              <HighlightBox>
                Puede retirar su consentimiento para el tratamiento de datos de salud en
                cualquier momento desde la sección de Privacidad de su configuración de
                cuenta, sin que ello afecte a la licitud del tratamiento previo.
              </HighlightBox>
            </SubSection>
          </Section>

          <Section title="6. Política de cookies">
            <p>Gantly utiliza las siguientes categorías de cookies:</p>
            <SubSection title="6.1. Cookies esenciales">
              <p>
                Necesarias para el funcionamiento de la plataforma: tokens de sesión JWT,
                preferencias de idioma y configuración de seguridad. No requieren
                consentimiento.
              </p>
            </SubSection>
            <SubSection title="6.2. Cookies funcionales">
              <p>
                Almacenan preferencias del usuario como el idioma seleccionado y la
                configuración del panel de usuario. Se activan con su consentimiento.
              </p>
            </SubSection>
            <SubSection title="6.3. Cookies analíticas">
              <p>
                Utilizadas para recopilar datos estadísticos anónimos sobre el uso de la
                plataforma. Se activan únicamente con su consentimiento previo.
              </p>
            </SubSection>
            <HighlightBox>
              Puede gestionar sus preferencias de cookies en cualquier momento desde la
              configuración de su cuenta o a través del banner de cookies al acceder a la
              plataforma.
            </HighlightBox>
          </Section>

          <Section title="7. Conservación de datos (periodo de retención)">
            <p>
              Los datos personales se conservan durante los siguientes periodos:
            </p>
            <BulletList
              items={[
                'Datos de cuenta: mientras la cuenta esté activa y hasta 30 días tras la solicitud de eliminación.',
                'Cuentas no verificadas: se eliminan automáticamente tras 30 días sin verificar el email.',
                'Datos de salud: durante la relación terapéutica y hasta 5 años después de su finalización, conforme a la normativa sanitaria española (Ley 41/2002).',
                'Datos de facturación: 5 años conforme a la normativa fiscal.',
                'Notificaciones: se eliminan automáticamente tras 90 días.',
                'Post-eliminación de cuenta: los datos se anonimizan y se eliminan completamente en un plazo de 30 días.',
                'Registros de auditoría: 2 años desde su generación.',
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
                'Profesionales de la salud mental: psicólogos asignados a través de la plataforma, quienes acceden únicamente a los datos necesarios para la prestación del servicio.',
                'Procesadores de pago: Stripe, Inc. (certificado PCI-DSS) para el procesamiento de pagos.',
                'Proveedores de infraestructura: servicios de alojamiento y base de datos.',
                'Autoridades competentes: cuando sea requerido por ley o resolución judicial.',
              ]}
            />
            <p>
              No realizamos transferencias internacionales de datos fuera del Espacio
              Económico Europeo (EEE) sin las garantías adecuadas conforme al RGPD.
            </p>
          </Section>

          <Section title="9. Derechos del usuario">
            <p>
              De conformidad con el RGPD y la LOPDGDD, usted tiene los siguientes
              derechos:
            </p>
            <NumberedList
              items={[
                'Derecho de acceso: obtener confirmación de si se tratan sus datos y acceder a los mismos.',
                'Derecho de rectificación: solicitar la corrección de datos inexactos o incompletos.',
                'Derecho de supresión ("derecho al olvido"): solicitar la eliminación de sus datos cuando ya no sean necesarios.',
                'Derecho de limitación: solicitar la restricción del tratamiento en determinadas circunstancias.',
                'Derecho de portabilidad: recibir sus datos en un formato estructurado, de uso común y lectura mecánica.',
                'Derecho de oposición: oponerse al tratamiento de sus datos en determinadas circunstancias.',
                'Derecho a retirar el consentimiento: en cualquier momento, sin que afecte a la licitud del tratamiento previo.',
                'Derecho a no ser objeto de decisiones automatizadas: incluida la elaboración de perfiles con efectos jurídicos.',
              ]}
            />
            <HighlightBox>
              Para ejercer cualquiera de estos derechos, puede enviar un correo
              electrónico a{' '}
              <strong>privacidad@gantly.es</strong> o a nuestro DPO en{' '}
              <strong>dpo@gantly.es</strong>, adjuntando copia de su documento de
              identidad. Responderemos en un plazo máximo de 30 días.
            </HighlightBox>
          </Section>

          <Section title="10. Seguridad de los datos">
            <p>
              Implementamos medidas técnicas y organizativas para proteger sus datos
              personales:
            </p>
            <BulletList
              items={[
                'Cifrado de mensajes de chat con AES-256-GCM.',
                'Contraseñas almacenadas con hash seguro (BCrypt).',
                'Autenticación mediante tokens JWT con expiración limitada.',
                'Filtros de limitación de velocidad (rate limiting) para prevenir ataques.',
                'Registros de auditoría para el seguimiento de accesos y operaciones sensibles.',
                'Protocolos HTTPS/TLS para todas las comunicaciones.',
                'Copias de seguridad periódicas y cifradas de la base de datos.',
              ]}
            />
          </Section>

          <Section title="11. Menores de edad">
            <p>
              La plataforma puede ser utilizada por menores de 14 años únicamente con el
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

          <Section title="12. Brechas de seguridad (Art. 33 y 34 RGPD)">
            <p>
              En caso de producirse una brecha de seguridad que afecte a sus datos
              personales, Gantly se compromete a:
            </p>
            <BulletList
              items={[
                'Notificar a la Agencia Espanola de Proteccion de Datos (AEPD) en un plazo maximo de 72 horas desde su deteccion, conforme al Art. 33 del RGPD.',
                'Informar a los usuarios afectados sin dilacion indebida cuando la brecha suponga un alto riesgo para sus derechos y libertades, conforme al Art. 34 del RGPD.',
                'Documentar internamente todas las brechas de seguridad, sus efectos y las medidas correctivas adoptadas.',
              ]}
            />
            <HighlightBox>
              Gantly dispone de sistemas automatizados de deteccion de anomalias de seguridad
              (rate limiting, monitorizacion de accesos, logs de auditoria) para minimizar el
              impacto de posibles incidentes.
            </HighlightBox>
          </Section>

          <Section title="13. Reclamaciones">
            <p>
              Si considera que el tratamiento de sus datos personales vulnera la
              normativa vigente, tiene derecho a presentar una reclamación ante la
              Agencia Española de Protección de Datos (AEPD):
            </p>
            <InfoBlock
              items={[
                { label: 'Web', value: 'www.aepd.es' },
                { label: 'Dirección', value: 'C/ Jorge Juan, 6, 28001 Madrid' },
                { label: 'Teléfono', value: '901 100 099' },
              ]}
            />
          </Section>

          <Section title="14. Modificaciones de esta política">
            <p>
              Nos reservamos el derecho de modificar esta Política de Privacidad en
              cualquier momento. Las modificaciones serán notificadas a través de la
              plataforma y/o por correo electrónico. Le recomendamos revisar esta
              política periódicamente.
            </p>
          </Section>

          {/* Footer */}
          <div className="mt-12 pt-8 text-center border-t border-gantly-blue/10">
            <p className="text-sm text-gantly-blue font-body m-0">
              Gantly Health S.L. - Todos los derechos reservados
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Reusable sub-components */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-heading text-[22px] font-bold text-gantly-navy tracking-tight m-0 mb-4 pb-2.5 border-b-2 border-gantly-blue/10">
        {title}
      </h2>
      <div className="font-body text-[15px] leading-[1.8] text-gantly-muted">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-4">
      <h3 className="font-heading text-[17px] font-semibold text-gantly-navy-400 m-0 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="pl-6 my-3 space-y-2 list-disc">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="pl-6 my-3 space-y-2 list-decimal">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))}
    </ol>
  );
}

function InfoBlock({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="my-4 p-5 rounded-xl bg-gantly-blue/[0.04] border border-gantly-blue/10">
      {items.map((item, i) => (
        <p key={i} className="my-1.5">
          <strong className="text-gantly-navy">{item.label}:</strong>{' '}
          {item.value}
        </p>
      ))}
    </div>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-5 rounded-xl bg-gradient-to-br from-gantly-blue/[0.06] to-gantly-cyan/[0.04] border-l-4 border-l-gantly-blue">
      {children}
    </div>
  );
}
