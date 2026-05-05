import { useState, useEffect } from 'react';
import { psychService } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import { toast } from './ui/Toast';

interface PsychEditProfileTabProps {
  onBack: () => void;
}

interface PsychProfileForm {
  bio: string;
  education: Array<{ degree: string; field: string; institution: string; startDate: string; endDate: string }>;
  certifications: Array<{ name: string; issuer: string; date: string; credentialId: string }>;
  interests: string[];
  specializations: string[];
  experience: Array<{ title: string; company: string; description: string; startDate: string; endDate: string }>;
  languages: Array<{ language: string; level: string }>;
  linkedinUrl: string;
  website: string;
  sessionPrice: string;
}

const parseJsonField = (field: string | null, defaultValue: any) => {
  if (!field) return defaultValue;
  try { return JSON.parse(field); } catch { return defaultValue; }
};

const profileToForm = (profile: any): PsychProfileForm => ({
  bio: profile.bio || '',
  education: parseJsonField(profile.education, []),
  certifications: parseJsonField(profile.certifications, []),
  interests: parseJsonField(profile.interests, []),
  specializations: parseJsonField(profile.specializations, []),
  experience: parseJsonField(profile.experience, []),
  languages: parseJsonField(profile.languages, []),
  linkedinUrl: profile.linkedinUrl || '',
  website: profile.website || '',
  sessionPrice: profile.sessionPrices ? (() => { try { const p = JSON.parse(profile.sessionPrices); return p.default || ''; } catch { return ''; } })() : ''
});

const defaultForm: PsychProfileForm = {
  bio: '',
  education: [],
  certifications: [],
  interests: [],
  specializations: [],
  experience: [],
  languages: [],
  linkedinUrl: '',
  website: '',
  sessionPrice: ''
};

export default function PsychEditProfileTab({ onBack }: PsychEditProfileTabProps) {
  const [psychologistProfile, setPsychologistProfile] = useState<any>(null);
  const [loadingPsychProfile, setLoadingPsychProfile] = useState(true);
  const [psychProfileForm, setPsychProfileForm] = useState<PsychProfileForm>(defaultForm);

  const loadPsychologistProfile = async () => {
    try {
      setLoadingPsychProfile(true);
      const profile = await psychService.getProfile();
      setPsychologistProfile(profile);
      setPsychProfileForm(profileToForm(profile));
    } catch (error: any) {
      toast.error('Error al cargar el perfil profesional');
    } finally {
      setLoadingPsychProfile(false);
    }
  };

  useEffect(() => {
    loadPsychologistProfile();
  }, []);

  const savePsychologistProfile = async () => {
    try {
      setLoadingPsychProfile(true);
      const profileToSave = {
        bio: psychProfileForm.bio,
        education: psychProfileForm.education.length > 0 ? JSON.stringify(psychProfileForm.education) : undefined,
        certifications: psychProfileForm.certifications.length > 0 ? JSON.stringify(psychProfileForm.certifications) : undefined,
        interests: psychProfileForm.interests.length > 0 ? JSON.stringify(psychProfileForm.interests) : undefined,
        specializations: psychProfileForm.specializations.length > 0 ? JSON.stringify(psychProfileForm.specializations) : undefined,
        experience: psychProfileForm.experience.length > 0 ? JSON.stringify(psychProfileForm.experience) : undefined,
        languages: psychProfileForm.languages.length > 0 ? JSON.stringify(psychProfileForm.languages) : undefined,
        linkedinUrl: psychProfileForm.linkedinUrl,
        website: psychProfileForm.website,
        sessionPrices: psychProfileForm.sessionPrice ? JSON.stringify({ default: psychProfileForm.sessionPrice }) : undefined
      };
      await psychService.updateProfile(profileToSave);
      await loadPsychologistProfile();
      toast.success('Perfil profesional actualizado exitosamente');
      onBack();
    } catch (error: any) {
      toast.error('Error al guardar el perfil profesional: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoadingPsychProfile(false);
    }
  };

  return (
    <div className="mt-10 bg-white rounded-2xl p-8 lg:p-12 border border-slate-100 shadow-card max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-gantly-text">
          Editar Perfil Profesional
        </h2>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gantly-blue-50 text-gantly-blue-600 rounded-xl font-medium hover:bg-gantly-blue-500 hover:text-white transition border border-gantly-blue-200"
        >
          ← Volver al Perfil
        </button>
      </div>

      {loadingPsychProfile ? (
        <LoadingSpinner text="Cargando perfil profesional..." />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Biografia */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="m-0 mb-4 text-xl font-semibold text-slate-800">
              Biografia / Sobre mi
            </h3>
            <textarea
              value={psychProfileForm.bio}
              onChange={(e) => setPsychProfileForm({ ...psychProfileForm, bio: e.target.value })}
              placeholder="Escribe una breve biografia sobre ti, tu experiencia y tu enfoque profesional..."
              rows={6}
              className="w-full p-4 rounded-lg border border-slate-300 text-[15px] font-inherit resize-y leading-relaxed"
            />
          </div>

          {/* Educacion */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-xl font-semibold text-slate-800">
                Educacion
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  education: [...psychProfileForm.education, { degree: '', field: '', institution: '', startDate: '', endDate: '' }]
                })}
                className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.education.map((edu, idx) => (
              <div key={idx} className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Titulo</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].degree = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: Licenciatura, Grado, Master..."
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Campo de estudio</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].field = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: Psicologia, Psicologia Clinica..."
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-[13px] font-semibold text-slate-700">Institucion</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...psychProfileForm.education];
                      newEducation[idx].institution = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                    }}
                    placeholder="Ej: Universidad Complutense de Madrid"
                    className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Fecha inicio</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].startDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: 2010"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Fecha fin</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].endDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: 2014 o 'En curso'"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newEducation = psychProfileForm.education.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                  }}
                  className="mt-3 px-3 py-1.5 bg-red-500 text-white border-none rounded-md text-[13px] cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.education.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm">
                No hay educacion anadida. Haz clic en "+ Anadir" para agregar una entrada.
              </div>
            )}
          </div>

          {/* Certificaciones */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-xl font-semibold text-slate-800">
                Certificaciones
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  certifications: [...psychProfileForm.certifications, { name: '', issuer: '', date: '', credentialId: '' }]
                })}
                className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.certifications.map((cert, idx) => (
              <div key={idx} className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="mb-3">
                  <label className="block mb-1 text-[13px] font-semibold text-slate-700">Nombre de la certificacion</label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => {
                      const newCerts = [...psychProfileForm.certifications];
                      newCerts[idx].name = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                    }}
                    placeholder="Ej: Certificacion en Terapia Cognitivo-Conductual"
                    className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Emitido por</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => {
                        const newCerts = [...psychProfileForm.certifications];
                        newCerts[idx].issuer = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      placeholder="Ej: Colegio Oficial de Psicologos"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Fecha</label>
                    <input
                      type="text"
                      value={cert.date}
                      onChange={(e) => {
                        const newCerts = [...psychProfileForm.certifications];
                        newCerts[idx].date = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      placeholder="Ej: 2020"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-[13px] font-semibold text-slate-700">ID de credencial (opcional)</label>
                  <input
                    type="text"
                    value={cert.credentialId}
                    onChange={(e) => {
                      const newCerts = [...psychProfileForm.certifications];
                      newCerts[idx].credentialId = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                    }}
                    placeholder="Ej: ABC123"
                    className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    const newCerts = psychProfileForm.certifications.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                  }}
                  className="mt-3 px-3 py-1.5 bg-red-500 text-white border-none rounded-md text-[13px] cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.certifications.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm">
                No hay certificaciones anadidas. Haz clic en "+ Anadir" para agregar una entrada.
              </div>
            )}
          </div>

          {/* Experiencia */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-xl font-semibold text-slate-800">
                Experiencia Profesional
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  experience: [...psychProfileForm.experience, { title: '', company: '', description: '', startDate: '', endDate: '' }]
                })}
                className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.experience.map((exp, idx) => (
              <div key={idx} className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Cargo / Titulo</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].title = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: Psicologo Clinico"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Empresa / Centro</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].company = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: Centro de Psicologia Clinica"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block mb-1 text-[13px] font-semibold text-slate-700">Descripcion</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...psychProfileForm.experience];
                      newExp[idx].description = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                    }}
                    placeholder="Describe tus responsabilidades y logros..."
                    rows={3}
                    className="w-full p-2.5 rounded-md border border-slate-300 text-sm resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Fecha inicio</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].startDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: 2015"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Fecha fin</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].endDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: 2020 o 'Actual'"
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newExp = psychProfileForm.experience.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                  }}
                  className="mt-3 px-3 py-1.5 bg-red-500 text-white border-none rounded-md text-[13px] cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.experience.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm">
                No hay experiencia anadida. Haz clic en "+ Anadir" para agregar una entrada.
              </div>
            )}
          </div>

          {/* Especializaciones */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-xl font-semibold text-slate-800">
                Especializaciones
              </h3>
              <button
                onClick={() => {
                  const newSpec = prompt('Ingresa una especializacion:');
                  if (newSpec && newSpec.trim()) {
                    setPsychProfileForm({
                      ...psychProfileForm,
                      specializations: [...psychProfileForm.specializations, newSpec.trim()]
                    });
                  }
                }}
                className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
              >
                + Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {psychProfileForm.specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gantly-blue-50 text-gantly-blue-700 rounded-full text-sm font-medium"
                >
                  {spec}
                  <button
                    onClick={() => {
                      const newSpecs = psychProfileForm.specializations.filter((_, i) => i !== idx);
                      setPsychProfileForm({ ...psychProfileForm, specializations: newSpecs });
                    }}
                    className="bg-transparent border-none text-gantly-blue-700 cursor-pointer text-base p-0 ml-1"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {psychProfileForm.specializations.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm">
                No hay especializaciones anadidas. Haz clic en "+ Anadir" para agregar una.
              </div>
            )}
          </div>

          {/* Intereses */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-xl font-semibold text-slate-800">
                Intereses y Pasiones
              </h3>
              <button
                onClick={() => {
                  const newInterest = prompt('Ingresa un interes o pasion:');
                  if (newInterest && newInterest.trim()) {
                    setPsychProfileForm({
                      ...psychProfileForm,
                      interests: [...psychProfileForm.interests, newInterest.trim()]
                    });
                  }
                }}
                className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
              >
                + Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {psychProfileForm.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                >
                  {interest}
                  <button
                    onClick={() => {
                      const newInterests = psychProfileForm.interests.filter((_, i) => i !== idx);
                      setPsychProfileForm({ ...psychProfileForm, interests: newInterests });
                    }}
                    className="bg-transparent border-none text-amber-800 cursor-pointer text-base p-0 ml-1"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {psychProfileForm.interests.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm">
                No hay intereses anadidos. Haz clic en "+ Anadir" para agregar uno.
              </div>
            )}
          </div>

          {/* Idiomas */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-xl font-semibold text-slate-800">
                Idiomas
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  languages: [...psychProfileForm.languages, { language: '', level: '' }]
                })}
                className="px-4 py-2 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.languages.map((lang, idx) => (
              <div key={idx} className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Idioma</label>
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => {
                        const newLangs = [...psychProfileForm.languages];
                        newLangs[idx].language = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      placeholder="Ej: Espanol, Ingles, Frances..."
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[13px] font-semibold text-slate-700">Nivel</label>
                    <input
                      type="text"
                      value={lang.level}
                      onChange={(e) => {
                        const newLangs = [...psychProfileForm.languages];
                        newLangs[idx].level = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      placeholder="Ej: Nativo, Avanzado, Intermedio..."
                      className="w-full p-2.5 rounded-md border border-slate-300 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newLangs = psychProfileForm.languages.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                  }}
                  className="mt-3 px-3 py-1.5 bg-red-500 text-white border-none rounded-md text-[13px] cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.languages.length === 0 && (
              <div className="text-center py-5 text-slate-500 text-sm">
                No hay idiomas anadidos. Haz clic en "+ Anadir" para agregar uno.
              </div>
            )}
          </div>

          {/* Precio por Sesion */}
          <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <h3 className="m-0 mb-4 text-xl font-semibold text-slate-800">
              Precio por Sesion
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Este sera el precio por defecto al crear nuevos horarios en tu calendario.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={psychProfileForm.sessionPrice}
                onChange={(e) => setPsychProfileForm({ ...psychProfileForm, sessionPrice: e.target.value })}
                placeholder="50.00"
                className="w-40 p-3 rounded-lg border border-slate-300 text-lg font-semibold"
              />
              <span className="text-base font-semibold text-slate-700">EUR</span>
            </div>
          </div>

          {/* LinkedIn y Sitio Web */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="m-0 mb-4 text-xl font-semibold text-slate-800">
              Enlaces Profesionales
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  URL de LinkedIn
                </label>
                <input
                  type="url"
                  value={psychProfileForm.linkedinUrl}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/tu-perfil"
                  className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  Sitio Web Personal
                </label>
                <input
                  type="url"
                  value={psychProfileForm.website}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, website: e.target.value })}
                  placeholder="https://tu-sitio-web.com"
                  className="w-full p-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Botones de accion */}
          <div className="flex gap-3 mt-4 pt-6 border-t-2 border-slate-200">
            <button
              onClick={savePsychologistProfile}
              disabled={loadingPsychProfile}
              className="flex-1 py-3.5 px-7 bg-gantly-blue-500 hover:bg-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-base transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {loadingPsychProfile ? 'Guardando...' : 'Guardar Perfil Profesional'}
            </button>
            <button
              onClick={() => {
                if (psychologistProfile) {
                  setPsychProfileForm(profileToForm(psychologistProfile));
                }
                onBack();
              }}
              className="py-3.5 px-7 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold cursor-pointer text-base transition-all hover:-translate-y-0.5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
