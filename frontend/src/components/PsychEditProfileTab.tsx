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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">edit</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 m-0">Editar Perfil Profesional</h2>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-sm cursor-pointer transition-all duration-300"
        >
          ← Volver al Perfil
        </button>
      </div>

      {loadingPsychProfile ? (
        <LoadingSpinner text="Cargando perfil profesional..." />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Biografia */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-gantly-blue to-gantly-blue-600"></div>
              <h3 className="m-0 text-lg font-semibold text-slate-800">Biografia / Sobre mi</h3>
            </div>
            <textarea
              value={psychProfileForm.bio}
              onChange={(e) => setPsychProfileForm({ ...psychProfileForm, bio: e.target.value })}
              placeholder="Escribe una breve biografia sobre ti, tu experiencia y tu enfoque profesional..."
              rows={5}
              className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-800 resize-y leading-relaxed outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
            />
          </div>

          {/* Educacion */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">Educacion</h3>
              </div>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  education: [...psychProfileForm.education, { degree: '', field: '', institution: '', startDate: '', endDate: '' }]
                })}
                className="px-4 py-2 bg-transparent text-gantly-blue border-2 border-dashed border-gantly-blue-300 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.education.map((edu, idx) => (
              <div key={idx} className="mb-4 p-5 bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Titulo</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].degree = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: Licenciatura, Grado, Master..."
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Campo de estudio</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].field = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: Psicologia Clinica..."
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Institucion</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...psychProfileForm.education];
                      newEducation[idx].institution = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                    }}
                    placeholder="Ej: Universidad Complutense de Madrid"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha inicio</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].startDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: 2010"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha fin</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].endDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: 2014 o 'En curso'"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newEducation = psychProfileForm.education.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                  }}
                  className="mt-3 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-red-100 hover:shadow-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.education.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay educacion anadida.</div>
            )}
          </div>

          {/* Certificaciones */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500"></div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">Certificaciones</h3>
              </div>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  certifications: [...psychProfileForm.certifications, { name: '', issuer: '', date: '', credentialId: '' }]
                })}
                className="px-4 py-2 bg-transparent text-gantly-blue border-2 border-dashed border-gantly-blue-300 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.certifications.map((cert, idx) => (
              <div key={idx} className="mb-4 p-5 bg-gradient-to-br from-slate-50 to-amber-50/20 rounded-xl border border-slate-100">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la certificacion</label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => {
                      const newCerts = [...psychProfileForm.certifications];
                      newCerts[idx].name = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                    }}
                    placeholder="Ej: Certificacion en Terapia Cognitivo-Conductual"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Emitido por</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => {
                        const newCerts = [...psychProfileForm.certifications];
                        newCerts[idx].issuer = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      placeholder="Ej: Colegio Oficial de Psicologos"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha</label>
                    <input
                      type="text"
                      value={cert.date}
                      onChange={(e) => {
                        const newCerts = [...psychProfileForm.certifications];
                        newCerts[idx].date = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      placeholder="Ej: 2020"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ID de credencial (opcional)</label>
                  <input
                    type="text"
                    value={cert.credentialId}
                    onChange={(e) => {
                      const newCerts = [...psychProfileForm.certifications];
                      newCerts[idx].credentialId = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                    }}
                    placeholder="Ej: ABC123"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                  />
                </div>
                <button
                  onClick={() => {
                    const newCerts = psychProfileForm.certifications.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                  }}
                  className="mt-3 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-red-100 hover:shadow-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.certifications.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay certificaciones anadidas.</div>
            )}
          </div>

          {/* Experiencia */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">Experiencia Profesional</h3>
              </div>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  experience: [...psychProfileForm.experience, { title: '', company: '', description: '', startDate: '', endDate: '' }]
                })}
                className="px-4 py-2 bg-transparent text-gantly-blue border-2 border-dashed border-gantly-blue-300 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.experience.map((exp, idx) => (
              <div key={idx} className="mb-4 p-5 bg-gradient-to-br from-slate-50 to-cyan-50/20 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo / Titulo</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].title = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: Psicologo Clinico"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Empresa / Centro</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].company = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: Centro de Psicologia"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...psychProfileForm.experience];
                      newExp[idx].description = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                    }}
                    placeholder="Describe tus responsabilidades y logros..."
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-y outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha inicio</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].startDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: 2015"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha fin</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].endDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: 2020 o 'Actual'"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newExp = psychProfileForm.experience.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                  }}
                  className="mt-3 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-red-100 hover:shadow-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.experience.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay experiencia anadida.</div>
            )}
          </div>

          {/* Especializaciones */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-500"></div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">Especializaciones</h3>
              </div>
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
                className="px-4 py-2 bg-transparent text-gantly-blue border-2 border-dashed border-gantly-blue-300 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                + Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5 mb-2">
              {psychProfileForm.specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-gantly-blue-50 to-gantly-blue-100 text-gantly-blue-700 rounded-xl text-sm font-medium border border-gantly-blue-200 hover:shadow-md transition-all duration-300"
                >
                  {spec}
                  <button
                    onClick={() => {
                      const newSpecs = psychProfileForm.specializations.filter((_, i) => i !== idx);
                      setPsychProfileForm({ ...psychProfileForm, specializations: newSpecs });
                    }}
                    className="bg-transparent border-none text-gantly-blue hover:text-red-500 cursor-pointer text-sm p-0 ml-0.5 transition-colors duration-200"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {psychProfileForm.specializations.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay especializaciones anadidas.</div>
            )}
          </div>

          {/* Intereses */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-500 to-pink-500"></div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">Intereses y Pasiones</h3>
              </div>
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
                className="px-4 py-2 bg-transparent text-gantly-blue border-2 border-dashed border-gantly-blue-300 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                + Anadir
              </button>
            </div>
            <div className="flex flex-wrap gap-2.5 mb-2">
              {psychProfileForm.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200 hover:shadow-md transition-all duration-300"
                >
                  {interest}
                  <button
                    onClick={() => {
                      const newInterests = psychProfileForm.interests.filter((_, i) => i !== idx);
                      setPsychProfileForm({ ...psychProfileForm, interests: newInterests });
                    }}
                    className="bg-transparent border-none text-amber-400 hover:text-red-500 cursor-pointer text-sm p-0 ml-0.5 transition-colors duration-200"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {psychProfileForm.interests.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay intereses anadidos.</div>
            )}
          </div>

          {/* Idiomas */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500"></div>
                <h3 className="m-0 text-lg font-semibold text-slate-800">Idiomas</h3>
              </div>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  languages: [...psychProfileForm.languages, { language: '', level: '' }]
                })}
                className="px-4 py-2 bg-transparent text-gantly-blue border-2 border-dashed border-gantly-blue-300 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gantly-blue-50 hover:border-gantly-blue-400"
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.languages.map((lang, idx) => (
              <div key={idx} className="mb-4 p-5 bg-gradient-to-br from-slate-50 to-teal-50/20 rounded-xl border border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma</label>
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => {
                        const newLangs = [...psychProfileForm.languages];
                        newLangs[idx].language = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      placeholder="Ej: Espanol, Ingles..."
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nivel</label>
                    <input
                      type="text"
                      value={lang.level}
                      onChange={(e) => {
                        const newLangs = [...psychProfileForm.languages];
                        newLangs[idx].level = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      placeholder="Ej: Nativo, Avanzado..."
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newLangs = psychProfileForm.languages.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                  }}
                  className="mt-3 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-red-100 hover:shadow-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.languages.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay idiomas anadidos.</div>
            )}
          </div>

          {/* Precio por Sesion */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-green-500"></div>
              <h3 className="m-0 text-lg font-semibold text-slate-800">Precio por Sesion</h3>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              Este sera el precio por defecto al crear nuevos horarios en tu calendario.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={psychProfileForm.sessionPrice}
                onChange={(e) => setPsychProfileForm({ ...psychProfileForm, sessionPrice: e.target.value })}
                placeholder="50.00"
                className="w-40 h-14 rounded-xl border border-slate-200 px-4 text-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
              />
              <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">EUR</span>
            </div>
          </div>

          {/* LinkedIn y Sitio Web */}
          <div className="bg-white rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-sky-500"></div>
              <h3 className="m-0 text-lg font-semibold text-slate-800">Enlaces Profesionales</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">URL de LinkedIn</label>
                <input
                  type="url"
                  value={psychProfileForm.linkedinUrl}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/tu-perfil"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sitio Web Personal</label>
                <input
                  type="url"
                  value={psychProfileForm.website}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, website: e.target.value })}
                  placeholder="https://tu-sitio-web.com"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-gantly-blue/20 focus:border-gantly-blue transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Botones de accion */}
          <div className="flex gap-3 mt-2 pt-6 border-t border-slate-200">
            <button
              onClick={savePsychologistProfile}
              disabled={loadingPsychProfile}
              className="flex-1 py-3 px-8 bg-gradient-to-r from-gantly-blue to-gantly-blue-600 text-white border-none rounded-xl font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
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
              className="py-3 px-8 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold cursor-pointer text-sm transition-all duration-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
