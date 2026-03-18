import { useState, useRef, useCallback } from 'react';
import { adminService } from '../services/api';

interface ParsedAnswer {
  text: string;
  value: number | null;
  position: number;
}

interface ParsedQuestion {
  position: number;
  text: string;
  answers: ParsedAnswer[];
}

interface ParseResult {
  detectedTitle: string;
  questionCount: number;
  questions: ParsedQuestion[];
}

interface TestImporterProps {
  onImported: () => void;
  onCancel: () => void;
}

export default function TestImporter({ onImported, onCancel }: TestImporterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [testType, setTestType] = useState<'generic' | 'tcp' | 'tca' | 'ansiedad'>('generic');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Solo se aceptan archivos .xlsx o .xls');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await adminService.parseTestExcel(file);
      setParseResult(result);
      setTitle(result.detectedTitle || '');
      setCode(result.detectedTitle?.toUpperCase().replace(/\s+/g, '_').substring(0, 50) || '');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al parsear el archivo');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (!parseResult || !code.trim() || !title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await adminService.confirmTestImport({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        testType,
        questions: parseResult.questions
      });
      alert(`Test importado: ${result.questionsCreated} preguntas, ${result.answersCreated} respuestas`);
      onImported();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (pos: number) => {
    const next = new Set(expandedQuestions);
    if (next.has(pos)) next.delete(pos);
    else next.add(pos);
    setExpandedQuestions(next);
  };

  // Vista de upload / drag-and-drop
  if (!parseResult) {
    return (
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Importar Test desde Excel</h2>
          <button className="btn-secondary" onClick={onCancel} style={{ width: 'auto', padding: '8px 16px' }}>
            Cancelar
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
            {loading ? '...' : '\u{1F4C4}'}
          </div>
          <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            {loading ? 'Parseando archivo...' : 'Arrastra un archivo .xlsx aquí'}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            o haz clic para seleccionar
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>

        {error && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            <strong>Formato esperado:</strong> Archivo Excel con preguntas numeradas (ej: "1 - Texto de la pregunta")
            seguidas de sus respuestas con valores numéricos. El sistema detecta automáticamente preguntas y respuestas.
          </p>
        </div>
      </div>
    );
  }

  // Vista de preview y confirmación
  return (
    <div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Preview de importación</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => { setParseResult(null); setError(null); }} style={{ width: 'auto', padding: '8px 16px' }}>
              Seleccionar otro archivo
            </button>
            <button className="btn-secondary" onClick={onCancel} style={{ width: 'auto', padding: '8px 16px' }}>
              Cancelar
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{parseResult.questionCount}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px' }}>preguntas detectadas</span>
          </div>
          <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {parseResult.questions.reduce((sum, q) => sum + (q.answers?.length || 0), 0)}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px' }}>respuestas totales</span>
          </div>
        </div>

        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Código del test *</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Ej: 16PF, BECK_II"
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Título del test *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Test de personalidad 16PF" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Descripción (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descripción del test..." />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tipo de test *</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {([
                { value: 'generic', label: 'Genérico', desc: 'Sin estructura predefinida' },
                { value: 'tcp', label: 'TCP (Personalidad)', desc: '5 factores + 17 subfactores 16PF' },
                { value: 'tca', label: 'TCA (Inteligencia)', desc: '7 rasgos: INV, IV, RA, APE, RV, APN + IG' },
                { value: 'ansiedad', label: 'Ansiedad', desc: '3 subfactores: Cognitivo, Fisiológico, Motor' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTestType(opt.value)}
                  style={{
                    flex: '1 1 140px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: testType === opt.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: testType === opt.value ? 'rgba(90, 146, 112, 0.08)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: testType === opt.value ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <button
          className="btn"
          onClick={handleImport}
          disabled={loading || !code.trim() || !title.trim()}
          style={{ width: 'auto', padding: '12px 32px' }}
        >
          {loading ? 'Importando...' : `Importar ${parseResult.questionCount} preguntas`}
        </button>
      </div>

      {/* Preview de preguntas */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Preguntas detectadas</h3>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {parseResult.questions.map(q => (
            <div
              key={q.position}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <div
                onClick={() => toggleQuestion(q.position)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
              >
                <span style={{
                  minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', fontSize: '13px', fontWeight: 'bold'
                }}>
                  {q.position}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '15px' }}>{q.text}</p>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {q.answers?.length || 0} respuestas
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {expandedQuestions.has(q.position) ? '\u25BC' : '\u25B6'}
                </span>
              </div>

              {expandedQuestions.has(q.position) && q.answers && q.answers.length > 0 && (
                <div style={{ marginTop: '12px', paddingLeft: '44px' }}>
                  {q.answers.map((a, idx) => (
                    <div key={idx} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 12px', marginBottom: '4px',
                      backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '14px'
                    }}>
                      <span>{a.text}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', minWidth: '50px', textAlign: 'right' }}>
                        Valor: {a.value ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
