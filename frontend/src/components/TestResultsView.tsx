import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, Award, AlertTriangle, ClipboardList, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { TestReportData, TestReportSubfactor, TestReportFactor } from './TestReport';

/* ── Level classification ───────────────────────────────────────── */

interface Level {
  label: string;
  color: string;      // tailwind text-*
  bg: string;         // tailwind bg-*
  bar: string;        // tailwind bg-* for bar fill
}

function getLevel(pct: number): Level {
  if (pct <= 20) return { label: 'Muy Bajo', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
  if (pct <= 40) return { label: 'Medio Bajo', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
  if (pct <= 60) return { label: 'Medio', color: 'text-gantly-blue', bg: 'bg-blue-50', bar: 'bg-gantly-blue' };
  if (pct <= 80) return { label: 'Medio Alto', color: 'text-teal-600', bg: 'bg-teal-50', bar: 'bg-teal-500' };
  return { label: 'Muy Alto', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
}

/* ── Radar Chart (SVG) ──────────────────────────────────────────── */

interface RadarItem {
  label: string;
  value: number; // 0-100
}

function smartLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label;
  // Strip common prefixes that don't add info
  const stripped = label
    .replace(/^Competencias\s+de\s+/i, '')
    .replace(/^Competencias\s+/i, '');
  if (stripped.length <= maxLen) return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  return stripped.charAt(0).toUpperCase() + stripped.slice(1, maxLen - 1) + '…';
}

function wrapLabel(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current && (current + ' ' + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2); // max 2 lines
}

function RadarChart({ items, size = 400 }: { items: RadarItem[]; size?: number }) {
  const n = items.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.30;
  const labelR = r + 32;
  const rings = [20, 40, 60, 80, 100];

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const polar = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const ringPaths = rings.map((pct) => {
    const ringR = (pct / 100) * r;
    const pts = Array.from({ length: n }, (_, i) => polar(startAngle + i * angleStep, ringR));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  });

  const dataPts = items.map((item, i) => polar(startAngle + i * angleStep, (item.value / 100) * r));
  const dataPath = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  const refPts = Array.from({ length: n }, (_, i) => polar(startAngle + i * angleStep, 0.5 * r));
  const refPath = refPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  const labelPositions = items.map((item, i) => {
    const pos = polar(startAngle + i * angleStep, labelR);
    const angle = startAngle + i * angleStep;
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.cos(angle) > 0.3) textAnchor = 'start';
    else if (Math.cos(angle) < -0.3) textAnchor = 'end';
    const cleaned = smartLabel(item.label, 22);
    const lines = wrapLabel(cleaned, 16);
    return { ...pos, textAnchor, lines };
  });

  return (
    <div className="flex justify-center" aria-label={`Gráfico radar con ${n} dimensiones`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[400px]">
        {/* Rings */}
        {ringPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#e2e8f0" strokeWidth={i === rings.length - 1 ? 1.5 : 0.8} />
        ))}

        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const end = polar(startAngle + i * angleStep, r);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth={0.8} />;
        })}

        {/* Reference 50% */}
        <path d={refPath} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />

        {/* Data polygon */}
        <motion.path
          d={dataPath}
          fill="rgba(46,147,204,0.12)"
          stroke="#2E93CC"
          strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Data dots */}
        {dataPts.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#2E93CC"
            stroke="white"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          />
        ))}

        {/* Labels (multi-line with smart truncation) */}
        {labelPositions.map((lp, i) => (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor={lp.textAnchor}
            dominantBaseline="central"
            className="fill-slate-600 text-[10px] font-body"
          >
            {lp.lines.map((line, li) => (
              <tspan
                key={li}
                x={lp.x}
                dy={li === 0 ? `${-(lp.lines.length - 1) * 6}px` : '12px'}
              >
                {line}
              </tspan>
            ))}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Score Card ─────────────────────────────────────────────────── */

interface ScoreCardProps {
  item: TestReportSubfactor | TestReportFactor;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function ScoreCard({ item, index, isSelected, onClick }: ScoreCardProps) {
  const pct = Math.round(item.percentage);
  const level = getLevel(pct);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${item.name}: ${pct}%, ${level.label}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`
        relative p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col
        ${isSelected
          ? 'border-gantly-blue bg-blue-50/50 shadow-md shadow-gantly-blue/10 ring-1 ring-gantly-blue/30'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
        }
      `}
    >
      {/* Code badge */}
      {item.code && (
        <span className="absolute top-2.5 right-3 text-[10px] font-heading font-bold text-slate-300 uppercase">{item.code}</span>
      )}
      {/* Bipolar label (min side) */}
      {item.minLabel && (
        <p className="text-[9px] font-heading font-bold text-slate-400 uppercase tracking-wide mb-0.5">{item.minLabel}</p>
      )}
      <div className="flex items-end justify-between gap-2 mb-1">
        <span className={`text-2xl font-heading font-extrabold leading-none ${level.color} tabular-nums`}>{pct}%</span>
      </div>
      <span className={`text-[10px] font-heading font-bold uppercase tracking-wide ${level.color} mb-2 block`}>
        {level.label}
      </span>
      {/* Bipolar mini labels */}
      {(item.minLabel || item.maxLabel) && (
        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
          <span>{item.minLabel || ''}</span>
          <span>{item.maxLabel || ''}</span>
        </div>
      )}
      <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${level.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, delay: index * 0.04 + 0.2 }}
        />
      </div>
      <p className="text-xs font-heading font-semibold text-gantly-text leading-tight mt-auto pt-2">{item.name || item.code}</p>
    </motion.div>
  );
}

/* ── Detail Panel ───────────────────────────────────────────────── */

function DetailPanel({ item }: { item: TestReportSubfactor | TestReportFactor }) {
  const pct = Math.round(item.percentage);
  const level = getLevel(pct);
  const isHighPole = pct >= 60;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-50/80 to-cyan-50/40 rounded-xl border border-gantly-blue/15 mt-3">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="flex-1">
            {/* Factor code */}
            {item.code && (
              <p className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-400 mb-1">{item.code}</p>
            )}
            {/* Factor name */}
            <h4 className="text-lg font-heading font-bold text-gantly-blue mb-3">{item.name || item.code}</h4>

            {/* Bipolar bar with labels */}
            {(item.minLabel || item.maxLabel) && (
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-heading font-semibold whitespace-nowrap transition-colors ${!isHighPole ? 'text-gantly-blue font-bold' : 'text-slate-400'}`}>
                  {item.minLabel || '—'}
                </span>
                <div className="relative flex-1 h-[10px] bg-slate-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400/50 z-[1]" />
                  <motion.div
                    className={`absolute top-0 h-full rounded-full ${level.bar}`}
                    style={{ opacity: 0.85 }}
                    initial={{ width: 0 }}
                    animate={{
                      left: pct < 50 ? `${pct}%` : '50%',
                      width: pct < 50 ? `${50 - pct}%` : `${pct - 50}%`,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className={`text-xs font-heading font-semibold whitespace-nowrap transition-colors ${isHighPole ? 'text-gantly-blue font-bold' : 'text-slate-400'}`}>
                  {item.maxLabel || '—'}
                </span>
              </div>
            )}

            {/* Level chip */}
            <span className={`text-xs font-heading font-bold px-3 py-1 rounded-full inline-block ${level.color} ${level.bg}`}>
              {level.label}
            </span>
          </div>

          {/* Score big number */}
          <div className="text-right flex-shrink-0">
            <p className={`text-4xl font-heading font-extrabold leading-none ${level.color} tabular-nums`}>{pct}<span className="text-lg">%</span></p>
            <p className="text-[10px] text-slate-400 font-body mt-1">{item.score} / {item.maxScore} puntos</p>
          </div>
        </div>

        {/* Full-width progress bar with scale */}
        <div className="mb-4">
          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${level.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Scale markers */}
          <div className="flex justify-between mt-1 px-0.5">
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <span key={v} className="text-[9px] text-slate-400 font-body tabular-nums">{v}</span>
            ))}
          </div>
        </div>

        {/* Level interpretation */}
        <div className="bg-white/70 rounded-lg p-3 border-l-[3px] border-l-gantly-blue">
          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-gantly-blue mb-1">Interpretacion</p>
          <p className="text-sm font-body text-slate-600 leading-relaxed">
            {pct <= 20 && `Nivel muy bajo en ${(item.name || item.code).toLowerCase()}. Este resultado sugiere un area que podria beneficiarse de atencion y desarrollo.`}
            {pct > 20 && pct <= 40 && `Nivel medio-bajo en ${(item.name || item.code).toLowerCase()}. Hay margen de mejora, aunque no representa una debilidad significativa.`}
            {pct > 40 && pct <= 60 && `Nivel medio en ${(item.name || item.code).toLowerCase()}. Resultado equilibrado que indica un perfil adaptable en esta dimension.`}
            {pct > 60 && pct <= 80 && `Nivel medio-alto en ${(item.name || item.code).toLowerCase()}. Buena competencia en esta area, es un recurso personal valioso.`}
            {pct > 80 && `Nivel muy alto en ${(item.name || item.code).toLowerCase()}. Destaca notablemente en esta dimension, lo que representa una fortaleza clara.`}
            {(item.minLabel && item.maxLabel) && (
              pct >= 60
                ? ` Tendencia hacia: ${item.maxLabel}.`
                : pct <= 40
                  ? ` Tendencia hacia: ${item.minLabel}.`
                  : ` Equilibrio entre ${item.minLabel} y ${item.maxLabel}.`
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Component (Full Page) ─────────────────────────────────── */

export default function TestResultsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const data = location.state as TestReportData | undefined;

  const handleExportPdf = async () => {
    if (!contentRef.current || !data) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      while (heightLeft > 0) {
        position = position - pageHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      const fileName = `${data.testTitle.replace(/\s+/g, '_')}_${data.userName?.replace(/\s+/g, '_') || 'resultado'}.pdf`;
      pdf.save(fileName);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <ClipboardList size={28} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-heading font-bold text-gantly-text mb-2">Sin datos de resultados</h2>
          <p className="text-sm text-slate-500 font-body mb-6">Vuelve a tu dashboard y selecciona un test completado.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-gantly-blue text-white rounded-xl font-heading font-medium text-sm cursor-pointer border-none hover:opacity-90 transition-opacity"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Items: prefer factors if available, else subfactors
  const displayItems: (TestReportSubfactor | TestReportFactor)[] =
    data.factors.length > 0 ? data.factors : data.subfactors;
  const secondaryItems = data.factors.length > 0 ? data.subfactors : [];

  // Strengths / weaknesses
  const strengths = displayItems.filter((i) => i.percentage > 60).sort((a, b) => b.percentage - a.percentage);
  const weaknesses = displayItems.filter((i) => i.percentage < 40).sort((a, b) => a.percentage - b.percentage);

  // Radar items (max 12 for readability)
  const radarItems: RadarItem[] = displayItems.slice(0, 12).map((i) => ({
    label: i.name || i.code,
    value: Math.round(i.percentage),
  }));

  const completedDate = data.endTime
    ? new Date(data.endTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-heading font-medium text-slate-600 hover:text-gantly-blue transition-colors cursor-pointer bg-transparent border-none p-0"
            aria-label="Volver a tests"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <p className="text-sm font-heading font-semibold text-gantly-text truncate flex-1">{data.testTitle}</p>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gantly-blue text-white text-xs font-heading font-semibold cursor-pointer border-none hover:bg-gantly-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Descargar PDF"
          >
            {exporting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span className="hidden sm:inline">{exporting ? 'Exportando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Header Card ──────────────────────────────────── */}
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gantly-blue via-gantly-blue to-cyan-600 p-6 sm:p-8 text-white mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">{data.testTitle}</h1>
          <p className="text-white/80 text-sm font-body mb-4">{data.userName}</p>

          <div className="flex flex-wrap gap-2">
            {completedDate && (
              <span className="text-xs font-body bg-white/15 px-3 py-1 rounded-full">{completedDate}</span>
            )}
            {data.duration && (
              <span className="text-xs font-body bg-white/15 px-3 py-1 rounded-full">{data.duration}</span>
            )}
            <span className="text-xs font-body bg-white/15 px-3 py-1 rounded-full">
              {displayItems.length} {data.factors.length > 0 ? 'factores' : 'subfactores'}
            </span>
            {secondaryItems.length > 0 && (
              <span className="text-xs font-body bg-white/15 px-3 py-1 rounded-full">
                {secondaryItems.length} subfactores
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Score Grid ───────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-lg font-heading font-bold text-gantly-text mb-4">
            {data.factors.length > 0 ? 'Factores' : 'Subfactores'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
            {displayItems.map((item, i) => (
              <ScoreCard
                key={item.code || i}
                item={item}
                index={i}
                isSelected={selectedItem === (item.code || String(i))}
                onClick={() =>
                  setSelectedItem((prev) => (prev === (item.code || String(i)) ? null : (item.code || String(i))))
                }
              />
            ))}
          </div>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedItem && (() => {
              const found = displayItems.find((i, idx) => (i.code || String(idx)) === selectedItem);
              return found ? <DetailPanel key={selectedItem} item={found} /> : null;
            })()}
          </AnimatePresence>

          {/* Secondary items (subfactors when factors shown) */}
          {secondaryItems.length > 0 && (
            <SubfactorsSection items={secondaryItems} />
          )}
        </section>

        {/* ── Radar + Strengths side-by-side on desktop ──── */}
        {(radarItems.length >= 3 || strengths.length > 0 || weaknesses.length > 0) && (
          <section className="mb-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              {radarItems.length >= 3 && (
                <div>
                  <h2 className="text-lg font-heading font-bold text-gantly-text mb-4">Perfil</h2>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm h-full flex flex-col justify-center">
                    <RadarChart items={radarItems} />
                    <p className="text-center text-[11px] text-slate-400 font-body mt-2">
                      Línea punteada = referencia 50%
                    </p>
                  </div>
                </div>
              )}

              {/* Strengths / Weaknesses */}
              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div>
                  <h2 className="text-lg font-heading font-bold text-gantly-text mb-4">Resumen</h2>
                  <div className="flex flex-col gap-4">
              {strengths.length > 0 && (
                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-heading font-bold text-emerald-700">Fortalezas</h3>
                  </div>
                  <ul className="space-y-2">
                    {strengths.slice(0, 5).map((s) => (
                      <li key={s.code} className="flex items-center justify-between text-sm">
                        <span className="font-body text-emerald-800">{s.name || s.code}</span>
                        <span className="font-heading font-semibold text-emerald-600 tabular-nums">{Math.round(s.percentage)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="p-5 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} className="text-orange-600" />
                    <h3 className="text-sm font-heading font-bold text-orange-700">Áreas de mejora</h3>
                  </div>
                  <ul className="space-y-2">
                    {weaknesses.slice(0, 5).map((w) => (
                      <li key={w.code} className="flex items-center justify-between text-sm">
                        <span className="font-body text-orange-800">{w.name || w.code}</span>
                        <span className="font-heading font-semibold text-orange-600 tabular-nums">{Math.round(w.percentage)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ── Subfactors collapsible section ─────────────────────────────── */

function SubfactorsSection({ items }: { items: (TestReportSubfactor | TestReportFactor)[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-heading font-semibold text-gantly-muted hover:text-gantly-text transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        Subfactores ({items.length})
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {items.map((item, i) => {
                const pct = Math.round(item.percentage);
                const level = getLevel(pct);
                return (
                  <div key={item.code || i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-heading font-semibold text-gantly-text truncate mr-2">{item.name || item.code}</span>
                      <span className={`text-xs font-heading font-bold ${level.color} tabular-nums`}>{pct}%</span>
                    </div>
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
