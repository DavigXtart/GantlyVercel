import React from 'react';

type AnswerRecord = {
  questionId: number;
  questionText: string;
  questionPosition?: number;
  questionType?: string;
  answerText?: string;
  answerValue?: number;
  numericValue?: number;
  textValue?: string;
};

interface InitialTestSummaryProps {
  test: {
    testId: number;
    testCode: string;
    testTitle: string;
    answers: AnswerRecord[];
  };
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '999px',
  background: 'rgba(90, 146, 112, 0.12)',
  color: '#2d4a3e',
  fontSize: '13px',
  fontWeight: 600,
  marginRight: '8px',
  marginBottom: '8px',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(90, 146, 112, 0.15)',
  borderRadius: '18px',
  padding: '20px',
  background: '#ffffff',
  boxShadow: '0 6px 20px rgba(90, 146, 112, 0.12)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1a2e22',
  marginBottom: '8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const valueStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#0f2319',
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#5a7266',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '4px',
};

const personalityConfig = [
  { position: 4, label: 'Introversión / Apertura' },
  { position: 5, label: 'Estructura' },
  { position: 6, label: 'Escucha sin juicio' },
  { position: 7, label: 'Orientación práctica' },
];

const InitialTestSummary: React.FC<InitialTestSummaryProps> = ({ test }) => {
  const answersByPosition = React.useMemo(() => {
    const map = new Map<number, AnswerRecord[]>();
    (test.answers || []).forEach((answer, index) => {
      const position = answer.questionPosition ?? index + 1;
      if (!map.has(position)) {
        map.set(position, []);
      }
      map.get(position)!.push(answer);
    });
    return map;
  }, [test.answers]);

  const pickSingle = (position: number) => answersByPosition.get(position)?.[0];
  const pickAll = (position: number) => answersByPosition.get(position) || [];

  const motivo = pickSingle(1);
  const preferenciaGenero = pickSingle(2);
  const estilo = pickSingle(3);
  const haIdo = pickSingle(8);
  const experiencia = pickSingle(9);
  const franjas = pickAll(10).map(item => item.answerText).filter(Boolean);
  const frecuencia = pickSingle(11);
  const presupuesto = pickSingle(12);
  const urgencia = pickSingle(13);
  const edad = pickSingle(14)?.numericValue;
  const idiomas = pickAll(15);
  const comentario = pickSingle(16)?.textValue;

  const personality = personalityConfig.map(config => {
    const answer = pickSingle(config.position);
    return {
      label: config.label,
      value: answer?.answerValue ?? answer?.numericValue ?? null,
      text: answer?.answerText,
    };
  });

  const idiomasLabels = idiomas
    .map(item => ({
      text: item.answerText,
      detail: item.textValue,
    }))
    .filter(item => item.text);

  return (
    <div style={{ marginBottom: '24px', display: 'grid', gap: '16px' }}>
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #f4f8f3 0%, #ffffff 80%)' }}>
        <div style={sectionTitleStyle}>Perfil express del paciente</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={labelStyle}>Motivo principal</div>
            <div style={valueStyle}>{motivo?.answerText || '—'}</div>
            {motivo?.textValue && <div style={{ fontSize: '13px', color: '#4a5d52', marginTop: '4px' }}>{motivo.textValue}</div>}
          </div>
          <div>
            <div style={labelStyle}>Preferencia de género</div>
            <div style={valueStyle}>{preferenciaGenero?.answerText || 'Indiferente'}</div>
          </div>
          <div>
            <div style={labelStyle}>Estilo deseado</div>
            <div style={valueStyle}>{estilo?.answerText || 'No especificado'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Personalidad y estilo</div>
          {personality.map(tag => (
            <div key={tag.label} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a2e22' }}>{tag.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#5a9270' }}>
                  {tag.value ?? '—'}
                </div>
                <div style={{ fontSize: '13px', color: '#55675c' }}>
                  {tag.text || 'Sin respuesta'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Disponibilidad y ritmo</div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Franja preferida</div>
            {franjas.length > 0 ? franjas.map(franja => (
              <span key={franja} style={chipStyle}>{franja}</span>
            )) : <div style={{ color: '#5b6c60' }}>No especificado</div>}
          </div>
          <div>
            <div style={labelStyle}>Frecuencia ideal</div>
            <div style={valueStyle}>{frecuencia?.answerText || 'No definido'}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Experiencia y urgencia</div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>¿Ha ido antes?</div>
            <div style={valueStyle}>{haIdo?.answerText || 'No'}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Experiencia previa</div>
            <div style={valueStyle}>{experiencia?.answerText || 'Sin registro'}</div>
          </div>
          <div>
            <div style={labelStyle}>Urgencia</div>
            <div style={valueStyle}>{urgencia?.answerText || 'No indicado'}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Presupuesto y contexto</div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Presupuesto por sesión</div>
            <div style={valueStyle}>{presupuesto?.answerText || 'No especificado'}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Edad</div>
            <div style={valueStyle}>{edad ? `${edad} años` : 'No indicado'}</div>
          </div>
          <div>
            <div style={labelStyle}>Idioma / Sensibilidad cultural</div>
            {idiomasLabels.length > 0 ? idiomasLabels.map(item => (
              <div key={`${item.text}-${item.detail || ''}`} style={{ marginBottom: '6px' }}>
                <span style={{ ...chipStyle, marginRight: '6px' }}>{item.text}</span>
                {item.detail && (
                  <span style={{ fontSize: '13px', color: '#5b6c60' }}>{item.detail}</span>
                )}
              </div>
            )) : <div style={{ color: '#5b6c60' }}>Sin preferencias</div>}
          </div>
        </div>
      </div>

      {comentario && (
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Notas adicionales</div>
          <p style={{ margin: 0, color: '#334138', fontSize: '15px', lineHeight: 1.5 }}>
            {comentario}
          </p>
        </div>
      )}
    </div>
  );
};

export default InitialTestSummary;

