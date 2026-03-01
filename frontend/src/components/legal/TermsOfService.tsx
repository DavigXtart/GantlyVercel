interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
              Terminos y Condiciones de Uso
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

          {/* Sections */}
          <Section title="1. Objeto y aceptacion">
            <p>
              Los presentes Terminos y Condiciones (en adelante, "los Terminos") regulan
              el acceso y uso de la plataforma Gantly (en adelante, "la Plataforma"),
              operada por Gantly Health S.L. (en adelante, "la Empresa"), con domicilio
              en Madrid, Espana.
            </p>
            <p className="mt-3">
              El acceso y uso de la Plataforma implica la aceptacion plena e
              incondicional de estos Terminos. Si no esta de acuerdo con alguna de las
              condiciones aqui establecidas, le rogamos que no utilice la Plataforma.
            </p>
          </Section>

          <Section title="2. Descripcion del servicio">
            <p>
              Gantly es una plataforma digital de salud mental que ofrece los siguientes
              servicios:
            </p>
            <BulletList
              items={[
                'Evaluacion psicologica mediante tests validados (personalidad, evaluaciones clinicas).',
                'Emparejamiento algoritmico con profesionales de la salud mental.',
                'Gestion de citas y sesiones de videollamada con psicologos colegiados.',
                'Mensajeria cifrada entre pacientes y profesionales.',
                'Diario de estado de animo y seguimiento emocional.',
                'Asignacion y gestion de tareas terapeuticas.',
                'Planes de suscripcion para acceso a funcionalidades premium.',
              ]}
            />
            <HighlightBox>
              Gantly no sustituye la atencion medica de urgencia. En caso de crisis o
              emergencia, contacte con el 024 (Linea de Atencion a la Conducta Suicida)
              o acuda al servicio de urgencias mas cercano.
            </HighlightBox>
          </Section>

          <Section title="3. Registro y cuentas de usuario">
            <SubSection title="3.1. Requisitos de registro">
              <BulletList
                items={[
                  'Ser mayor de 18 anos, o mayor de 14 anos con consentimiento parental verificado.',
                  'Proporcionar informacion veraz, completa y actualizada.',
                  'Disponer de una direccion de correo electronico valida.',
                  'Aceptar estos Terminos y la Politica de Privacidad.',
                ]}
              />
            </SubSection>
            <SubSection title="3.2. Tipos de cuenta">
              <BulletList
                items={[
                  'Usuario (paciente): acceso a evaluaciones, citas, chat y seguimiento emocional.',
                  'Profesional (psicologo): debe acreditar colegiacion vigente y cualificacion profesional.',
                  'Empresa: acceso a planes corporativos de bienestar para empleados.',
                  'Administrador: gestion interna de la plataforma (uso exclusivo del equipo de Gantly).',
                ]}
              />
            </SubSection>
            <SubSection title="3.3. Responsabilidad de la cuenta">
              <p>
                El usuario es responsable de mantener la confidencialidad de sus
                credenciales de acceso. Cualquier actividad realizada desde su cuenta se
                considerara realizada por el titular. En caso de acceso no autorizado,
                debera notificarlo inmediatamente a{' '}
                <strong>soporte@gantly.es</strong>.
              </p>
            </SubSection>
          </Section>

          <Section title="4. Obligaciones del usuario">
            <p>Al utilizar la Plataforma, el usuario se compromete a:</p>
            <NumberedList
              items={[
                'Utilizar la Plataforma unicamente para los fines previstos.',
                'No proporcionar informacion falsa o enganosa.',
                'No suplantar la identidad de otro usuario o profesional.',
                'No utilizar la Plataforma para actividades ilegales, difamatorias u ofensivas.',
                'No intentar acceder a cuentas, datos o sistemas ajenos.',
                'No interferir con el funcionamiento de la Plataforma mediante software malicioso, ataques de fuerza bruta u otros mecanismos.',
                'Respetar la propiedad intelectual de la Plataforma y de terceros.',
                'No compartir contenido de las sesiones terapeuticas sin consentimiento.',
                'Cumplir con las instrucciones y recomendaciones de los profesionales asignados en el contexto del servicio.',
              ]}
            />
          </Section>

          <Section title="5. Profesionales de la salud mental">
            <SubSection title="5.1. Requisitos para profesionales">
              <p>
                Los profesionales que operan a traves de Gantly deben cumplir los
                siguientes requisitos:
              </p>
              <BulletList
                items={[
                  'Estar colegiados en el Colegio Oficial de Psicologos correspondiente.',
                  'Disponer de titulacion universitaria en Psicologia y, en su caso, habilitacion sanitaria.',
                  'Mantener un seguro de responsabilidad civil profesional vigente.',
                  'Cumplir con el codigo deontologico de la profesion.',
                  'Completar el proceso de verificacion de identidad y credenciales de la Plataforma.',
                ]}
              />
            </SubSection>
            <SubSection title="5.2. Relacion profesional-paciente">
              <p>
                La relacion terapeutica se establece directamente entre el profesional y
                el paciente. Gantly actua como intermediario tecnologico y no interviene
                en las decisiones clinicas del profesional.
              </p>
            </SubSection>
          </Section>

          <Section title="6. Pagos y suscripciones">
            <SubSection title="6.1. Modelos de pago">
              <BulletList
                items={[
                  'Plan gratuito: acceso limitado a funcionalidades basicas de evaluacion y seguimiento.',
                  'Plan premium: acceso completo a sesiones, chat ilimitado, evaluaciones avanzadas y herramientas de seguimiento.',
                  'Planes corporativos: tarifas especiales para empresas con condiciones especificas.',
                ]}
              />
            </SubSection>
            <SubSection title="6.2. Procesamiento de pagos">
              <p>
                Los pagos se procesan a traves de Stripe, Inc., una plataforma de pagos
                certificada PCI-DSS. Gantly no almacena datos de tarjetas de credito o
                debito. Al realizar un pago, acepta los{' '}
                <strong>terminos de servicio de Stripe</strong>.
              </p>
            </SubSection>
            <SubSection title="6.3. Facturacion y renovacion">
              <BulletList
                items={[
                  'Las suscripciones se facturan de forma mensual o anual, segun el plan seleccionado.',
                  'La renovacion es automatica salvo cancelacion previa antes de la fecha de renovacion.',
                  'Los precios pueden ser modificados con un preaviso minimo de 30 dias.',
                ]}
              />
            </SubSection>
            <SubSection title="6.4. Politica de reembolso">
              <p>
                Puede solicitar un reembolso dentro de los 14 dias posteriores a la
                contratacion, siempre que no haya utilizado los servicios premium
                (sesiones con profesionales, tests avanzados). Para solicitar un
                reembolso, contacte con{' '}
                <strong>facturacion@gantly.es</strong>.
              </p>
            </SubSection>
          </Section>

          <Section title="7. Propiedad intelectual">
            <p>
              Todos los contenidos de la Plataforma, incluyendo pero sin limitarse a
              textos, graficos, logotipos, iconos, imagenes, software, algoritmos de
              emparejamiento y tests psicologicos, son propiedad de Gantly Health S.L. o
              de sus licenciantes y estan protegidos por las leyes de propiedad
              intelectual e industrial.
            </p>
            <BulletList
              items={[
                'Queda prohibida la reproduccion, distribucion, comunicacion publica o transformacion de los contenidos sin autorizacion expresa.',
                'El usuario conserva la titularidad de los datos personales e informacion que introduzca en la Plataforma.',
                'El usuario concede a Gantly una licencia limitada y no exclusiva para procesar sus datos con el fin de prestar el servicio.',
              ]}
            />
          </Section>

          <Section title="8. Limitacion de responsabilidad">
            <SubSection title="8.1. Servicio tecnologico">
              <p>
                Gantly proporciona una plataforma tecnologica de intermediacion. No
                somos un centro sanitario ni prestamos directamente servicios de
                asistencia sanitaria. La responsabilidad clinica recae en los
                profesionales colegiados que operan a traves de la Plataforma.
              </p>
            </SubSection>
            <SubSection title="8.2. Disponibilidad del servicio">
              <p>
                Gantly se esfuerza por mantener la Plataforma disponible de forma
                continua, pero no garantiza la ausencia de interrupciones por
                mantenimiento, actualizaciones o causas de fuerza mayor. No seremos
                responsables de danos derivados de la indisponibilidad temporal del
                servicio.
              </p>
            </SubSection>
            <SubSection title="8.3. Exclusiones de responsabilidad">
              <p>Gantly no se hace responsable de:</p>
              <BulletList
                items={[
                  'Decisiones clinicas tomadas por los profesionales.',
                  'Danos derivados del uso inadecuado de la Plataforma por parte del usuario.',
                  'Perdida de datos causada por fallos tecnicos fuera de nuestro control.',
                  'Contenido generado por terceros o usuarios en la Plataforma.',
                  'Danos indirectos, incidentales o consecuentes.',
                ]}
              />
            </SubSection>
            <SubSection title="8.4. Limitacion cuantitativa">
              <p>
                En cualquier caso, la responsabilidad total de Gantly frente al usuario
                por cualquier concepto no excedera del importe total abonado por el
                usuario en los 12 meses anteriores al hecho causante.
              </p>
            </SubSection>
          </Section>

          <Section title="9. Suspension y terminacion">
            <SubSection title="9.1. Suspension por parte de Gantly">
              <p>
                Nos reservamos el derecho de suspender o cancelar su cuenta de forma
                temporal o permanente en los siguientes casos:
              </p>
              <BulletList
                items={[
                  'Incumplimiento de estos Terminos.',
                  'Uso fraudulento o abusivo de la Plataforma.',
                  'Suplantacion de identidad o informacion falsa.',
                  'Impago reiterado de las cuotas de suscripcion.',
                  'Conducta que ponga en riesgo la seguridad de otros usuarios o de la Plataforma.',
                ]}
              />
            </SubSection>
            <SubSection title="9.2. Baja voluntaria del usuario">
              <p>
                El usuario puede darse de baja en cualquier momento desde la
                configuracion de su cuenta o solicitandolo por escrito a{' '}
                <strong>soporte@gantly.es</strong>. Tras la baja:
              </p>
              <BulletList
                items={[
                  'Se cancelara la suscripcion activa (sin derecho a reembolso del periodo en curso).',
                  'Sus datos personales seran tratados conforme a la Politica de Privacidad y los plazos legales de conservacion.',
                  'Podra solicitar la portabilidad de sus datos antes de la eliminacion definitiva.',
                ]}
              />
            </SubSection>
            <SubSection title="9.3. Efectos de la terminacion">
              <p>
                La terminacion de la relacion contractual no afectara a las
                obligaciones que por su naturaleza deban subsistir, incluyendo las
                relativas a propiedad intelectual, limitacion de responsabilidad y
                proteccion de datos.
              </p>
            </SubSection>
          </Section>

          <Section title="10. Resolucion de conflictos">
            <SubSection title="10.1. Mediacion">
              <p>
                En caso de controversia derivada de estos Terminos, las partes se
                comprometen a intentar resolver el conflicto de forma amistosa mediante
                mediacion, antes de acudir a la via judicial.
              </p>
            </SubSection>
            <SubSection title="10.2. Jurisdiccion">
              <p>
                Para cualquier controversia que no pueda resolverse de forma amistosa,
                las partes se someten a la jurisdiccion de los Juzgados y Tribunales de
                Madrid, Espana, con renuncia a cualquier otro fuero que pudiera
                corresponderles, salvo que la normativa de consumidores establezca lo
                contrario.
              </p>
            </SubSection>
            <SubSection title="10.3. Legislacion aplicable">
              <p>
                Estos Terminos se regiran e interpretaran de conformidad con la
                legislacion espanola y la normativa de la Union Europea aplicable.
              </p>
            </SubSection>
          </Section>

          <Section title="11. Plataforma de resolucion de litigios en linea">
            <p>
              De conformidad con el Reglamento (UE) 524/2013, le informamos de que la
              Comision Europea pone a disposicion de los consumidores una plataforma de
              resolucion de litigios en linea, accesible en:{' '}
              <strong>https://ec.europa.eu/consumers/odr</strong>
            </p>
          </Section>

          <Section title="12. Modificaciones">
            <p>
              Gantly se reserva el derecho de modificar estos Terminos en cualquier
              momento. Las modificaciones sustanciales seran notificadas a los usuarios
              con un preaviso minimo de 30 dias a traves de la Plataforma y/o por correo
              electronico. El uso continuado de la Plataforma tras la notificacion
              implica la aceptacion de los nuevos Terminos.
            </p>
          </Section>

          <Section title="13. Disposiciones generales">
            <BulletList
              items={[
                'Nulidad parcial: si alguna clausula de estos Terminos fuera declarada nula o inaplicable, las demas clausulas mantendran su plena validez y eficacia.',
                'Cesion: el usuario no podra ceder sus derechos u obligaciones derivados de estos Terminos sin el consentimiento previo y por escrito de Gantly.',
                'Renuncia: la falta de ejercicio de un derecho no implicara la renuncia al mismo.',
                'Acuerdo completo: estos Terminos, junto con la Politica de Privacidad y cualquier condicion particular aplicable, constituyen el acuerdo completo entre las partes.',
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
