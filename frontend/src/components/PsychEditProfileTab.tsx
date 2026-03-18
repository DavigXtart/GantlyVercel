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
    <div className="mt-10 bg-white rounded-3xl p-8 lg:p-12 border border-sage/10 soft-shadow max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-normal text-forest">
          Editar Perfil Profesional
        </h2>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-sage/10 text-forest rounded-full font-medium hover:bg-sage hover:text-white transition border border-sage/20"
        >
          ← Volver al Perfil
        </button>
      </div>

      {loadingPsychProfile ? (
        <LoadingSpinner text="Cargando perfil profesional..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Biografia */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
              Biografia / Sobre mi
            </h3>
            <textarea
              value={psychProfileForm.bio}
              onChange={(e) => setPsychProfileForm({ ...psychProfileForm, bio: e.target.value })}
              placeholder="Escribe una breve biografia sobre ti, tu experiencia y tu enfoque profesional..."
              rows={6}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* Educacion */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Educacion
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  education: [...psychProfileForm.education, { degree: '', field: '', institution: '', startDate: '', endDate: '' }]
                })}
                style={{
                  padding: '8px 16px',
                  background: '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Titulo</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].degree = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: Licenciatura, Grado, Master..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Campo de estudio</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].field = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: Psicologia, Psicologia Clinica..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Institucion</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const newEducation = [...psychProfileForm.education];
                      newEducation[idx].institution = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                    }}
                    placeholder="Ej: Universidad Complutense de Madrid"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha inicio</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].startDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: 2010"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha fin</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => {
                        const newEducation = [...psychProfileForm.education];
                        newEducation[idx].endDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                      }}
                      placeholder="Ej: 2014 o 'En curso'"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newEducation = psychProfileForm.education.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, education: newEducation });
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.education.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                No hay educacion anadida. Haz clic en "+ Anadir" para agregar una entrada.
              </div>
            )}
          </div>

          {/* Certificaciones */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Certificaciones
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  certifications: [...psychProfileForm.certifications, { name: '', issuer: '', date: '', credentialId: '' }]
                })}
                style={{
                  padding: '8px 16px',
                  background: '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.certifications.map((cert, idx) => (
              <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Nombre de la certificacion</label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => {
                      const newCerts = [...psychProfileForm.certifications];
                      newCerts[idx].name = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                    }}
                    placeholder="Ej: Certificacion en Terapia Cognitivo-Conductual"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Emitido por</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => {
                        const newCerts = [...psychProfileForm.certifications];
                        newCerts[idx].issuer = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      placeholder="Ej: Colegio Oficial de Psicologos"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha</label>
                    <input
                      type="text"
                      value={cert.date}
                      onChange={(e) => {
                        const newCerts = [...psychProfileForm.certifications];
                        newCerts[idx].date = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                      }}
                      placeholder="Ej: 2020"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>ID de credencial (opcional)</label>
                  <input
                    type="text"
                    value={cert.credentialId}
                    onChange={(e) => {
                      const newCerts = [...psychProfileForm.certifications];
                      newCerts[idx].credentialId = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                    }}
                    placeholder="Ej: ABC123"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  />
                </div>
                <button
                  onClick={() => {
                    const newCerts = psychProfileForm.certifications.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, certifications: newCerts });
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.certifications.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                No hay certificaciones anadidas. Haz clic en "+ Anadir" para agregar una entrada.
              </div>
            )}
          </div>

          {/* Experiencia */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Experiencia Profesional
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  experience: [...psychProfileForm.experience, { title: '', company: '', description: '', startDate: '', endDate: '' }]
                })}
                style={{
                  padding: '8px 16px',
                  background: '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.experience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Cargo / Titulo</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].title = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: Psicologo Clinico"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Empresa / Centro</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].company = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: Centro de Psicologia Clinica"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Descripcion</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...psychProfileForm.experience];
                      newExp[idx].description = e.target.value;
                      setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                    }}
                    placeholder="Describe tus responsabilidades y logros..."
                    rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha inicio</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].startDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: 2015"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Fecha fin</label>
                    <input
                      type="text"
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...psychProfileForm.experience];
                        newExp[idx].endDate = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                      }}
                      placeholder="Ej: 2020 o 'Actual'"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newExp = psychProfileForm.experience.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, experience: newExp });
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.experience.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                No hay experiencia anadida. Haz clic en "+ Anadir" para agregar una entrada.
              </div>
            )}
          </div>

          {/* Especializaciones */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
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
                style={{
                  padding: '8px 16px',
                  background: '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Anadir
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {psychProfileForm.specializations.map((spec, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#dcfce7',
                    color: '#15803d',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {spec}
                  <button
                    onClick={() => {
                      const newSpecs = psychProfileForm.specializations.filter((_, i) => i !== idx);
                      setPsychProfileForm({ ...psychProfileForm, specializations: newSpecs });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#15803d',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0,
                      marginLeft: '4px'
                    }}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {psychProfileForm.specializations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                No hay especializaciones anadidas. Haz clic en "+ Anadir" para agregar una.
              </div>
            )}
          </div>

          {/* Intereses */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
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
                style={{
                  padding: '8px 16px',
                  background: '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Anadir
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {psychProfileForm.interests.map((interest, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {interest}
                  <button
                    onClick={() => {
                      const newInterests = psychProfileForm.interests.filter((_, i) => i !== idx);
                      setPsychProfileForm({ ...psychProfileForm, interests: newInterests });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#92400e',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0,
                      marginLeft: '4px'
                    }}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {psychProfileForm.interests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                No hay intereses anadidos. Haz clic en "+ Anadir" para agregar uno.
              </div>
            )}
          </div>

          {/* Idiomas */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Idiomas
              </h3>
              <button
                onClick={() => setPsychProfileForm({
                  ...psychProfileForm,
                  languages: [...psychProfileForm.languages, { language: '', level: '' }]
                })}
                style={{
                  padding: '8px 16px',
                  background: '#5a9270',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Anadir
              </button>
            </div>
            {psychProfileForm.languages.map((lang, idx) => (
              <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Idioma</label>
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => {
                        const newLangs = [...psychProfileForm.languages];
                        newLangs[idx].language = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      placeholder="Ej: Espanol, Ingles, Frances..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Nivel</label>
                    <input
                      type="text"
                      value={lang.level}
                      onChange={(e) => {
                        const newLangs = [...psychProfileForm.languages];
                        newLangs[idx].level = e.target.value;
                        setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                      }}
                      placeholder="Ej: Nativo, Avanzado, Intermedio..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newLangs = psychProfileForm.languages.filter((_, i) => i !== idx);
                    setPsychProfileForm({ ...psychProfileForm, languages: newLangs });
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
            {psychProfileForm.languages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                No hay idiomas anadidos. Haz clic en "+ Anadir" para agregar uno.
              </div>
            )}
          </div>

          {/* Precio por Sesion */}
          <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #d1fae5' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
              Precio por Sesion
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Este sera el precio por defecto al crear nuevos horarios en tu calendario.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={psychProfileForm.sessionPrice}
                onChange={(e) => setPsychProfileForm({ ...psychProfileForm, sessionPrice: e.target.value })}
                placeholder="50.00"
                style={{
                  width: '160px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '18px',
                  fontWeight: 600
                }}
              />
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>EUR</span>
            </div>
          </div>

          {/* LinkedIn y Sitio Web */}
          <div style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
              Enlaces Profesionales
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  URL de LinkedIn
                </label>
                <input
                  type="url"
                  value={psychProfileForm.linkedinUrl}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/tu-perfil"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Sitio Web Personal
                </label>
                <input
                  type="url"
                  value={psychProfileForm.website}
                  onChange={(e) => setPsychProfileForm({ ...psychProfileForm, website: e.target.value })}
                  placeholder="https://tu-sitio-web.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botones de accion */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
            <button
              onClick={savePsychologistProfile}
              disabled={loadingPsychProfile}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #5a9270 0%, #4a8062 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: loadingPsychProfile ? 'not-allowed' : 'pointer',
                opacity: loadingPsychProfile ? 0.6 : 1,
                fontSize: '16px',
                transition: 'all 0.2s',
                flex: 1
              }}
              onMouseEnter={(e) => {
                if (!loadingPsychProfile) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
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
              style={{
                padding: '14px 28px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
