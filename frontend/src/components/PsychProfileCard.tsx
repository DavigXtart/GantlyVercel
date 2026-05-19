import React, { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Globe,
  Linkedin,
  Star,
  ShieldCheck,
  MessageSquareQuote,
  Languages,
  Award,
} from 'lucide-react';
import StarRating from './ui/StarRating';
import { parseProfileJson } from '../utils/parseProfileJson';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Rating {
  rating: number;
  comment: string;
  patientName: string;
  createdAt: string;
}

interface RatingSummary {
  averageRating: number | null;
  totalRatings: number;
}

export interface PsychProfileCardProps {
  profile: any;
  ratingSummary?: RatingSummary | null;
  ratings?: Rating[];
  matchPercentage?: number;
  onBack: () => void;
  onSelect?: () => void;
  selecting?: boolean;
}

type TabKey = 'about' | 'education' | 'experience' | 'opinions';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getMatchColor(p: number) {
  if (p >= 80) return 'bg-gantly-emerald text-white';
  if (p >= 60) return 'bg-gantly-blue text-white';
  if (p >= 40) return 'bg-gantly-gold text-gantly-navy';
  return 'bg-red-500 text-white';
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PsychProfileCard: React.FC<PsychProfileCardProps> = ({
  profile,
  ratingSummary,
  ratings = [],
  matchPercentage,
  onBack,
  onSelect,
  selecting = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('about');

  const specializations = parseProfileJson<string[]>(profile.specializations, []);
  const education = parseProfileJson<any[]>(profile.education, []);
  const certifications = parseProfileJson<any[]>(profile.certifications, []);
  const experience = parseProfileJson<any[]>(profile.experience, []);
  const languages = parseProfileJson<string[]>(profile.languages, []);
  const interests = parseProfileJson<string[]>(profile.interests, []);

  const hasRating = ratingSummary && ratingSummary.averageRating !== null && ratingSummary.averageRating !== undefined;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'about', label: 'Sobre mi' },
    { key: 'education', label: 'Formacion' },
    { key: 'experience', label: 'Experiencia' },
    { key: 'opinions', label: 'Opiniones', count: ratings.length },
  ];

  return (
    <div className="w-full">
      {/* Back */}
      <button
        onClick={onBack}
        className="text-sm text-gantly-blue hover:text-gantly-navy cursor-pointer transition-all duration-200 flex items-center gap-1.5 hover:bg-gantly-ice px-3 py-2 rounded-xl mb-4"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      {/* ============================================================ */}
      {/*  Hero Banner — full width, horizontal                        */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 mb-4 relative">
        {matchPercentage !== undefined && (
          <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${getMatchColor(matchPercentage)}`}>
            {matchPercentage}% match
          </span>
        )}

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 ring-2 ring-slate-100">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-heading font-bold text-slate-400">
                {profile.name?.charAt(0).toUpperCase() || 'P'}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-heading font-bold text-gantly-navy mb-0.5 truncate pr-20">
              {profile.name}
            </h2>
            <p className="text-sm text-gantly-muted font-body mb-1.5">Psicólogo/a</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
              {hasRating && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={ratingSummary!.averageRating!} size="sm" />
                  <span className="text-sm font-semibold text-gantly-navy">
                    {ratingSummary!.averageRating!.toFixed(1)}
                  </span>
                  <span className="text-xs text-gantly-muted">
                    · {ratingSummary!.totalRatings} {ratingSummary!.totalRatings === 1 ? 'opinion' : 'opiniones'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-gantly-emerald text-xs font-medium">
                <BadgeCheck size={14} />
                Profesional verificado
              </div>

              {(profile.linkedinUrl || profile.website) && (
                <div className="flex items-center gap-2.5">
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gantly-muted hover:text-gantly-blue transition-colors">
                      <Linkedin size={15} />
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-gantly-muted hover:text-gantly-blue transition-colors">
                      <Globe size={15} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {specializations.map((s, i) => (
                  <span key={i} className="px-2.5 py-0.5 bg-gantly-blue/8 text-gantly-blue rounded-full text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Stats row + Trust badge — full width                        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-3 text-center">
          <Star size={16} className="text-gantly-gold mx-auto mb-1" />
          <p className="text-base font-bold text-gantly-navy font-heading leading-tight">
            {hasRating ? ratingSummary!.averageRating!.toFixed(1) : '—'}
          </p>
          <p className="text-[11px] text-gantly-muted">Valoracion</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-3 text-center">
          <Briefcase size={16} className="text-gantly-blue mx-auto mb-1" />
          <p className="text-base font-bold text-gantly-navy font-heading leading-tight">
            {experience.length > 0 ? experience.length : '—'}
          </p>
          <p className="text-[11px] text-gantly-muted">{experience.length === 1 ? 'puesto' : 'puestos'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-3 text-center">
          <Languages size={16} className="text-gantly-cyan mx-auto mb-1" />
          <p className="text-base font-bold text-gantly-navy font-heading leading-tight">
            {languages.length > 0 ? languages.join(', ') : '—'}
          </p>
          <p className="text-[11px] text-gantly-muted">Idiomas</p>
        </div>
        <div className="bg-gantly-emerald/5 rounded-2xl border border-gantly-emerald/15 py-3.5 px-3 text-center">
          <ShieldCheck size={16} className="text-gantly-emerald mx-auto mb-1" />
          <p className="text-[11px] font-semibold text-gantly-emerald leading-tight">Verificado</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Titulacion · Colegiacion</p>
        </div>
      </div>

      {/* Select button (matching) — full width above tabs */}
      {onSelect && (
        <button
          onClick={onSelect}
          disabled={selecting}
          className={`w-full py-3 px-6 text-white border-none rounded-xl font-semibold text-base font-body transition-all mb-4 ${
            selecting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gantly-blue cursor-pointer shadow-glow-blue hover:bg-gantly-blue-600 hover:scale-[1.005]'
          }`}
        >
          {selecting ? 'Seleccionando...' : 'Seleccionar este psicologo'}
        </button>
      )}

      {/* ============================================================ */}
      {/*  Tabs — full width                                           */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3.5 text-sm font-medium font-body transition-colors cursor-pointer ${
                activeTab === t.key
                  ? 'text-gantly-blue border-b-2 border-gantly-blue'
                  : 'text-gantly-muted hover:text-gantly-navy'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1.5 text-[10px] bg-gantly-blue/10 text-gantly-blue px-1.5 py-0.5 rounded-full font-semibold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* --- About --- */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {profile.bio ? (
                <div>
                  <h4 className="text-xs font-semibold text-gantly-muted uppercase tracking-wider mb-2">Biografia</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-body">{profile.bio}</p>
                </div>
              ) : (
                <p className="text-sm text-gantly-muted italic">Sin descripcion disponible.</p>
              )}

              {languages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gantly-muted uppercase tracking-wider mb-2">Idiomas</h4>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {interests.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gantly-muted uppercase tracking-wider mb-2">Intereses y enfoques</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gantly-emerald/8 text-gantly-emerald rounded-full text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {certifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gantly-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Award size={13} />
                    Certificaciones
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {certifications.map((c, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-medium text-gantly-navy">{c.name || 'Certificacion'}</p>
                        <p className="text-xs text-gantly-muted mt-0.5">
                          {c.issuer || ''}{c.date ? ` · ${c.date}` : ''}
                          {c.credentialId ? ` · ID: ${c.credentialId}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Education --- */}
          {activeTab === 'education' && (
            <div className="space-y-3">
              {education.length > 0 ? (
                education.map((edu, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-gantly-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                      <GraduationCap size={18} className="text-gantly-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gantly-navy">
                        {edu.degree || 'Titulo'}{edu.field ? ` en ${edu.field}` : ''}
                      </p>
                      <p className="text-sm text-gantly-blue mt-0.5">{edu.institution || ''}</p>
                      {(edu.startDate || edu.endDate) && (
                        <p className="text-xs text-gantly-muted mt-1">
                          {edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.startDate || edu.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gantly-muted italic">Sin formacion registrada.</p>
              )}
            </div>
          )}

          {/* --- Experience --- */}
          {activeTab === 'experience' && (
            <div className="space-y-3">
              {experience.length > 0 ? (
                experience.map((exp, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-gantly-emerald/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase size={18} className="text-gantly-emerald" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gantly-navy">{exp.title || 'Cargo'}</p>
                      <p className="text-sm text-gantly-emerald mt-0.5">{exp.company || ''}</p>
                      {exp.description && (
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{exp.description}</p>
                      )}
                      {(exp.startDate || exp.endDate) && (
                        <p className="text-xs text-gantly-muted mt-1.5">
                          {exp.startDate && exp.endDate
                            ? `${exp.startDate} – ${exp.endDate}`
                            : exp.startDate
                            ? `Desde ${exp.startDate}`
                            : `Hasta ${exp.endDate}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gantly-muted italic">Sin experiencia registrada.</p>
              )}
            </div>
          )}

          {/* --- Opinions --- */}
          {activeTab === 'opinions' && (
            <div>
              {ratings.length > 0 ? (
                <div className="space-y-3">
                  {ratings.map((r, i) => (
                    <div key={i} className="flex gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-gantly-blue/10 flex items-center justify-center shrink-0 text-sm font-bold text-gantly-blue">
                        {r.patientName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gantly-navy truncate">{r.patientName}</span>
                          <StarRating rating={r.rating} size="sm" />
                        </div>
                        <p className="text-xs text-gantly-muted mb-1.5">{formatDate(r.createdAt)}</p>
                        {r.comment && (
                          <p className="text-sm text-slate-600 leading-relaxed">"{r.comment}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquareQuote size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-gantly-muted">Este profesional aun no tiene opiniones.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PsychProfileCard;
