import SEO from '../seo/SEO';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-gantly-cloud text-gantly-text">
      <SEO
        title="Términos de servicio"
        description="Términos y condiciones de uso de Gantly. Plataforma de salud mental para pacientes, psicólogos y clínicas."
        path="/terminos"
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
              Términos y Condiciones de Uso
            </h1>
            <p className="text-[15px] text-gantly-blue font-medium font-body m-0">
              Última actualización: 1 de marzo de 2026
            </p>
          </div>

          {/* Sections */}
          <Section title="1. Objeto y aceptación">
            <p>
              Los presentes Términos y Condiciones (en adelante, "los Términos") regulan
              el acceso y uso de la plataforma Gantly (en adelante, "la Plataforma"),
              operada por Gantly Health S.L. (en adelante, "la Empresa"), con domicilio
              en Madrid, España.
            </p>
            <p className="mt-3">
              El acceso y uso de la Plataforma implica la aceptación plena e
              incondicional de estos Términos. Si no está de acuerdo con alguna de las
              condiciones aquí establecidas, le rogamos que no utilice la Plataforma.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              Gantly es una plataforma digital de salud mental que ofrece los siguientes
              servicios:
            </p>
            <BulletList
              items={[
                'Evaluación psicológica mediante tests validados (personalidad, evaluaciones clínicas).',
                'Emparejamiento algorítmico con profesionales de la salud mental.',
                'Gestión de citas y sesiones de videollamada con psicólogos colegiados.',
                'Mensajería cifrada entre pacientes y profesionales.',
                'Diario de estado de ánimo y seguimiento emocional.',
                'Asignación y gestión de tareas terapéuticas.',
                'Planes de suscripción para acceso a funcionalidades premium.',
              ]}
            />
            <HighlightBox>
              Gantly no sustituye la atención médica de urgencia. En caso de crisis o
              emergencia, contacte con el 024 (Línea de Atención a la Conducta Suicida)
              o acuda al servicio de urgencias más cercano.
            </HighlightBox>
          </Section>

          <Section title="3. Registro y cuentas de usuario">
            <SubSection title="3.1. Requisitos de registro">
              <BulletList
                items={[
                  'Ser mayor de 18 años, o mayor de 14 años con consentimiento parental verificado.',
                  'Proporcionar información veraz, completa y actualizada.',
                  'Disponer de una dirección de correo electrónico válida.',
                  'Aceptar estos Términos y la Política de Privacidad.',
                ]}
              />
            </SubSection>
            <SubSection title="3.2. Tipos de cuenta">
              <BulletList
                items={[
                  'Usuario (paciente): acceso a evaluaciones, citas, chat y seguimiento emocional.',
                  'Profesional (psicólogo): debe acreditar colegiación vigente y cualificación profesional.',
                  'Empresa: acceso a planes corporativos de bienestar para empleados.',
                  'Administrador: gestión interna de la plataforma (uso exclusivo del equipo de Gantly).',
                ]}
              />
            </SubSection>
            <SubSection title="3.3. Responsabilidad de la cuenta">
              <p>
                El usuario es responsable de mantener la confidencialidad de sus
                credenciales de acceso. Cualquier actividad realizada desde su cuenta se
                considerará realizada por el titular. En caso de acceso no autorizado,
                deberá notificarlo inmediatamente a{' '}
                <strong>soporte@gantly.es</strong>.
              </p>
            </SubSection>
          </Section>

          <Section title="4. Obligaciones del usuario">
            <p>Al utilizar la Plataforma, el usuario se compromete a:</p>
            <NumberedList
              items={[
                'Utilizar la Plataforma únicamente para los fines previstos.',
                'No proporcionar información falsa o engañosa.',
                'No suplantar la identidad de otro usuario o profesional.',
                'No utilizar la Plataforma para actividades ilegales, difamatorias u ofensivas.',
                'No intentar acceder a cuentas, datos o sistemas ajenos.',
                'No interferir con el funcionamiento de la Plataforma mediante software malicioso, ataques de fuerza bruta u otros mecanismos.',
                'Respetar la propiedad intelectual de la Plataforma y de terceros.',
                'No compartir contenido de las sesiones terapéuticas sin consentimiento.',
                'Cumplir con las instrucciones y recomendaciones de los profesionales asignados en el contexto del servicio.',
              ]}
            />
          </Section>

          <Section title="5. Profesionales de la salud mental">
            <SubSection title="5.1. Requisitos para profesionales">
              <p>
                Los profesionales que operan a través de Gantly deben cumplir los
                siguientes requisitos:
              </p>
              <BulletList
                items={[
                  'Estar colegiados en el Colegio Oficial de Psicólogos correspondiente.',
                  'Disponer de titulación universitaria en Psicología y, en su caso, habilitación sanitaria.',
                  'Mantener un seguro de responsabilidad civil profesional vigente.',
                  'Cumplir con el código deontológico de la profesión.',
                  'Completar el proceso de verificación de identidad y credenciales de la Plataforma.',
                ]}
              />
            </SubSection>
            <SubSection title="5.2. Relación profesional-paciente">
              <p>
                La relación terapéutica se establece directamente entre el profesional y
                el paciente. Gantly actúa como intermediario tecnológico y no interviene
                en las decisiones clínicas del profesional.
              </p>
            </SubSection>
          </Section>

          <Section title="6. Pagos y suscripciones">
            <SubSection title="6.1. Modelos de pago">
              <BulletList
                items={[
                  'Plan gratuito: acceso limitado a funcionalidades básicas de evaluación y seguimiento.',
                  'Plan premium: acceso completo a sesiones, chat ilimitado, evaluaciones avanzadas y herramientas de seguimiento.',
                  'Planes corporativos: tarifas especiales para empresas con condiciones específicas.',
                ]}
              />
            </SubSection>
            <SubSection title="6.2. Procesamiento de pagos">
              <p>
                Los pagos se procesan a través de Stripe, Inc., una plataforma de pagos
                certificada PCI-DSS. Gantly no almacena datos de tarjetas de crédito o
                débito. Al realizar un pago, acepta los{' '}
                <strong>términos de servicio de Stripe</strong>.
              </p>
            </SubSection>
            <SubSection title="6.3. Facturación y renovación">
              <BulletList
                items={[
                  'Las suscripciones se facturan de forma mensual o anual, según el plan seleccionado.',
                  'La renovación es automática salvo cancelación previa antes de la fecha de renovación.',
                  'Los precios pueden ser modificados con un preaviso mínimo de 30 días.',
                ]}
              />
            </SubSection>
            <SubSection title="6.4. Política de reembolso">
              <p>
                Puede solicitar un reembolso dentro de los 14 días posteriores a la
                contratación, siempre que no haya utilizado los servicios premium
                (sesiones con profesionales, tests avanzados). Para solicitar un
                reembolso, contacte con{' '}
                <strong>facturación@gantly.es</strong>.
              </p>
            </SubSection>
          </Section>

          <Section title="7. Propiedad intelectual">
            <p>
              Todos los contenidos de la Plataforma, incluyendo pero sin limitarse a
              textos, gráficos, logotipos, iconos, imágenes, software, algoritmos de
              emparejamiento y tests psicológicos, son propiedad de Gantly Health S.L. o
              de sus licenciantes y están protegidos por las leyes de propiedad
              intelectual e industrial.
            </p>
            <BulletList
              items={[
                'Queda prohibida la reproducción, distribución, comunicación pública o transformación de los contenidos sin autorización expresa.',
                'El usuario conserva la titularidad de los datos personales e información que introduzca en la Plataforma.',
                'El usuario concede a Gantly una licencia limitada y no exclusiva para procesar sus datos con el fin de prestar el servicio.',
              ]}
            />
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <SubSection title="8.1. Servicio tecnológico">
              <p>
                Gantly proporciona una plataforma tecnológica de intermediación. No
                somos un centro sanitario ni prestamos directamente servicios de
                asistencia sanitaria. La responsabilidad clínica recae en los
                profesionales colegiados que operan a través de la Plataforma.
              </p>
            </SubSection>
            <SubSection title="8.2. Disponibilidad del servicio">
              <p>
                Gantly se esfuerza por mantener la Plataforma disponible de forma
                continua, pero no garantiza la ausencia de interrupciones por
                mantenimiento, actualizaciones o causas de fuerza mayor. No seremos
                responsables de daños derivados de la indisponibilidad temporal del
                servicio.
              </p>
            </SubSection>
            <SubSection title="8.3. Exclusiones de responsabilidad">
              <p>Gantly no se hace responsable de:</p>
              <BulletList
                items={[
                  'Decisiones clínicas tomadas por los profesionales.',
                  'Daños derivados del uso inadecuado de la Plataforma por parte del usuario.',
                  'Pérdida de datos causada por fallos técnicos fuera de nuestro control.',
                  'Contenido generado por terceros o usuarios en la Plataforma.',
                  'Daños indirectos, incidentales o consecuentes.',
                ]}
              />
            </SubSection>
            <SubSection title="8.4. Limitación cuantitativa">
              <p>
                En cualquier caso, la responsabilidad total de Gantly frente al usuario
                por cualquier concepto no excederá del importe total abonado por el
                usuario en los 12 meses anteriores al hecho causante.
              </p>
            </SubSection>
          </Section>

          <Section title="9. Suspensión y terminación">
            <SubSection title="9.1. Suspensión por parte de Gantly">
              <p>
                Nos reservamos el derecho de suspender o cancelar su cuenta de forma
                temporal o permanente en los siguientes casos:
              </p>
              <BulletList
                items={[
                  'Incumplimiento de estos Términos.',
                  'Uso fraudulento o abusivo de la Plataforma.',
                  'Suplantación de identidad o información falsa.',
                  'Impago reiterado de las cuotas de suscripción.',
                  'Conducta que ponga en riesgo la seguridad de otros usuarios o de la Plataforma.',
                ]}
              />
            </SubSection>
            <SubSection title="9.2. Baja voluntaria del usuario">
              <p>
                El usuario puede darse de baja en cualquier momento desde la
                configuración de su cuenta o solicitándolo por escrito a{' '}
                <strong>soporte@gantly.es</strong>. Tras la baja:
              </p>
              <BulletList
                items={[
                  'Se cancelará la suscripción activa (sin derecho a reembolso del periodo en curso).',
                  'Sus datos personales serán tratados conforme a la Política de Privacidad y los plazos legales de conservación.',
                  'Podrá solicitar la portabilidad de sus datos antes de la eliminación definitiva.',
                ]}
              />
            </SubSection>
            <SubSection title="9.3. Efectos de la terminación">
              <p>
                La terminación de la relación contractual no afectará a las
                obligaciones que por su naturaleza deban subsistir, incluyendo las
                relativas a propiedad intelectual, limitación de responsabilidad y
                protección de datos.
              </p>
            </SubSection>
          </Section>

          <Section title="10. Resolución de conflictos">
            <SubSection title="10.1. Mediación">
              <p>
                En caso de controversia derivada de estos Términos, las partes se
                comprometen a intentar resolver el conflicto de forma amistosa mediante
                mediación, antes de acudir a la vía judicial.
              </p>
            </SubSection>
            <SubSection title="10.2. Jurisdicción">
              <p>
                Para cualquier controversia que no pueda resolverse de forma amistosa,
                las partes se someten a la jurisdicción de los Juzgados y Tribunales de
                Madrid, España, con renuncia a cualquier otro fuero que pudiera
                corresponderles, salvo que la normativa de consumidores establezca lo
                contrario.
              </p>
            </SubSection>
            <SubSection title="10.3. Legislación aplicable">
              <p>
                Estos Términos se regirán e interpretarán de conformidad con la
                legislación española y la normativa de la Unión Europea aplicable.
              </p>
            </SubSection>
          </Section>

          <Section title="11. Plataforma de resolución de litigios en línea">
            <p>
              De conformidad con el Reglamento (UE) 524/2013, le informamos de que la
              Comisión Europea pone a disposición de los consumidores una plataforma de
              resolución de litigios en línea, accesible en:{' '}
              <strong>https://ec.europa.eu/consumers/odr</strong>
            </p>
          </Section>

          <Section title="12. Modificaciones">
            <p>
              Gantly se reserva el derecho de modificar estos Términos en cualquier
              momento. Las modificaciones sustanciales serán notificadas a los usuarios
              con un preaviso mínimo de 30 días a través de la Plataforma y/o por correo
              electrónico. El uso continuado de la Plataforma tras la notificación
              implica la aceptación de los nuevos Términos.
            </p>
          </Section>

          <Section title="13. Disposiciones generales">
            <BulletList
              items={[
                'Nulidad parcial: si alguna cláusula de estos Términos fuera declarada nula o inaplicable, las demás cláusulas mantendrán su plena validez y eficacia.',
                'Cesión: el usuario no podrá ceder sus derechos u obligaciones derivados de estos Términos sin el consentimiento previo y por escrito de Gantly.',
                'Renuncia: la falta de ejercicio de un derecho no implicará la renuncia al mismo.',
                'Acuerdo completo: estos Términos, junto con la Política de Privacidad y cualquier condición particular aplicable, constituyen el acuerdo completo entre las partes.',
              ]}
            />
          </Section>

          <Section title="14. Contacto">
            <p>
              Para cualquier consulta relacionada con estos Terminos, puede
              ponerse en contacto con nosotros:
            </p>
            <InfoBlock
              items={[
                { label: 'Correo general', value: 'info@gantly.es' },
                { label: 'Soporte tecnico', value: 'soporte@gantly.es' },
                { label: 'Facturacion', value: 'facturacion@gantly.es' },
                { label: 'Proteccion de datos', value: 'privacidad@gantly.es' },
              ]}
            />
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
