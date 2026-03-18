import { useRef, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface TestReportSubfactor {
  code: string;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface TestReportFactor {
  code: string;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface TestReportData {
  testTitle: string;
  userName: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  subfactors: TestReportSubfactor[];
  factors: TestReportFactor[];
}

export interface TestReportHandle {
  exportPdf: () => Promise<void>;
}

interface TestReportProps {
  data: TestReportData;
}

const CELL_STYLE: React.CSSProperties = {
  border: '1px solid #999',
  padding: '4px 6px',
  fontSize: '12px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function FactorScaleTable({ items }: { items: TestReportSubfactor[] }) {
  const scale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
      <thead>
        <tr>
          <th style={{ ...CELL_STYLE, width: '140px', textAlign: 'left', fontWeight: 'bold' }}>FACTORES</th>
          <th style={{ ...CELL_STYLE, width: '36px', textAlign: 'center', fontWeight: 'bold' }}>DT</th>
          {scale.map(n => (
            <th key={n} style={{ ...CELL_STYLE, width: '36px', textAlign: 'center', fontSize: '10px', padding: '2px', color: '#666' }}>
              {n === 5 ? <><span style={{ fontSize: '9px', display: 'block', color: '#888' }}>PROMEDIO</span>{n}</> : n}
            </th>
          ))}
          <th style={{ ...CELL_STYLE, width: '36px', textAlign: 'center', fontWeight: 'bold' }}>F</th>
          <th style={{ ...CELL_STYLE, width: '140px', textAlign: 'left', fontWeight: 'bold' }}>FACTORES</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const dt = Math.max(1, Math.min(10, Math.round((item.percentage / 100) * 10)));
          return (
            <tr key={idx}>
              <td style={{ ...CELL_STYLE, textAlign: 'left' }}>{item.minLabel || item.name}</td>
              <td style={{ ...CELL_STYLE, textAlign: 'center', fontWeight: 'bold' }}>{dt}</td>
              {scale.map(n => (
                <td key={n} style={{
                  ...CELL_STYLE,
                  padding: 0,
                  backgroundColor: n <= dt ? '#999' : '#fff',
                  minWidth: '28px',
                }} />
              ))}
              <td style={{ ...CELL_STYLE, textAlign: 'center', fontWeight: 'bold' }}>{item.code}</td>
              <td style={{ ...CELL_STYLE, textAlign: 'left' }}>{item.maxLabel || ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PercentageScaleTable({ items }: { items: (TestReportSubfactor | TestReportFactor)[] }) {
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const zones = ['MUY BAJO', '', 'MEDIO BAJO', '', 'MEDIO', '', 'MEDIO ALTO', '', 'MUY ALTO'];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
      <thead>
        <tr>
          <th style={{ ...CELL_STYLE, width: '220px' }} />
          <th style={{ ...CELL_STYLE, width: '36px' }} />
          {zones.map((z, i) => (
            <th key={i} style={{ ...CELL_STYLE, textAlign: 'center', fontSize: '9px', padding: '2px', color: '#666' }}>
              {z}
            </th>
          ))}
        </tr>
        <tr>
          <th style={{ ...CELL_STYLE, textAlign: 'left', fontWeight: 'bold' }}>RASGOS</th>
          <th style={{ ...CELL_STYLE, textAlign: 'center', fontWeight: 'bold' }}>PS</th>
          {ticks.map(n => (
            <th key={n} style={{ ...CELL_STYLE, textAlign: 'center', fontSize: '10px', padding: '2px', color: '#666' }}>
              {n}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, idx) => {
          const ps = Math.round(item.percentage);
          const filledCells = Math.round(ps / 10);
          return (
            <tr key={idx}>
              <td style={{ ...CELL_STYLE, textAlign: 'left' }}>{'name' in item ? item.name : item.code}</td>
              <td style={{ ...CELL_STYLE, textAlign: 'center', fontWeight: 'bold' }}>{ps}</td>
              {ticks.map((n, i) => (
                <td key={n} style={{
                  ...CELL_STYLE,
                  padding: 0,
                  minWidth: '28px',
                }}>
                  {i < filledCells && (
                    <div style={{
                      width: '100%',
                      height: '16px',
                      background: 'repeating-linear-gradient(90deg, #333 0px, #333 2px, #fff 2px, #fff 4px)',
                    }} />
                  )}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const TestReport = forwardRef<TestReportHandle, TestReportProps>(({ data }, ref) => {
  const reportRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    exportPdf: async () => {
      if (!reportRef.current) return;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgRatio = canvas.height / canvas.width;
      const imgHeight = usableWidth * imgRatio;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, imgHeight);
      } else {
        // Multi-page: split canvas
        const pxPerPage = canvas.width * ((pageHeight - margin * 2) / usableWidth);
        let yOffset = 0;
        let pageNum = 0;
        while (yOffset < canvas.height) {
          if (pageNum > 0) pdf.addPage();
          const sliceHeight = Math.min(pxPerPage, canvas.height - yOffset);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceImgHeight = usableWidth * (sliceHeight / canvas.width);
          pdf.addImage(sliceData, 'PNG', margin, margin, usableWidth, sliceImgHeight);
          yOffset += sliceHeight;
          pageNum++;
        }
      }

      const fileName = `${data.testTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${data.userName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);
    },
  }));

  const hasSubfactorsWithLabels = data.subfactors.some(sf => sf.minLabel || sf.maxLabel);
  const showFactorScale = hasSubfactorsWithLabels && data.subfactors.length > 0;

  return (
    <div
      ref={reportRef}
      style={{
        padding: '24px',
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        maxWidth: '800px',
      }}
    >
      {/* Header */}
      <div style={{
        border: '1px solid #000',
        padding: '16px 20px',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{data.testTitle}</div>
        <div>Tipo de encuesta: Secuencial</div>
        <div>Usuario: {data.userName}</div>
        <div>
          Inicio: {formatDateTime(data.startTime)}
          {data.endTime && <> | Fin: {formatDateTime(data.endTime)}</>}
          {data.duration && <> | Tiempo: {data.duration}</>}
        </div>
      </div>

      {/* Subfactors table (1-10 scale with bipolar labels) */}
      {showFactorScale && (
        <FactorScaleTable items={data.subfactors} />
      )}

      {/* Factors as percentage table if no bipolar labels on subfactors */}
      {!showFactorScale && data.subfactors.length > 0 && (
        <PercentageScaleTable items={data.subfactors} />
      )}

      {/* Global factors summary if we have factors with labels */}
      {data.factors.length > 0 && data.subfactors.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
            FACTORES GLOBALES
          </div>
          <FactorScaleTable items={data.factors.map(f => ({
            ...f,
            minLabel: f.minLabel || f.name,
            maxLabel: f.maxLabel || '',
          }))} />
        </div>
      )}

      {/* Raw score summary table */}
      {data.subfactors.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <td style={{ ...CELL_STYLE, fontWeight: 'bold' }}>MUESTREO</td>
                {data.subfactors.map(sf => (
                  <td key={sf.code} style={{ ...CELL_STYLE, textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>{sf.code}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...CELL_STYLE, fontWeight: 'bold' }}>PUNTUACION</td>
                {data.subfactors.map(sf => (
                  <td key={sf.code} style={{ ...CELL_STYLE, textAlign: 'center' }}>{Math.round(sf.score)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

TestReport.displayName = 'TestReport';

export default TestReport;
