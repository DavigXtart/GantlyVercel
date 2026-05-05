import React from 'react';

interface UserPsychProfileTabProps {
  psychologistProfile: any;
  loadingPsychologistProfile: boolean;
  onBack: () => void;
}

const UserPsychProfileTab: React.FC<UserPsychProfileTabProps> = ({
  psychologistProfile,
  loadingPsychologistProfile,
  onBack,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-card p-10 border border-slate-100 max-w-[900px] mx-auto mt-10">
      {loadingPsychologistProfile ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-base">
            Cargando perfil del psicologo...
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gantly-text">
              Perfil del Psicologo
            </h2>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-slate-100 text-gantly-text border border-slate-200 rounded-xl font-semibold cursor-pointer text-sm hover:bg-slate-200 transition-colors"
            >
              ← Volver
            </button>
          </div>

          {/* Header del perfil */}
          <div className="bg-gradient-to-br from-gantly-cloud-100 to-gantly-blue-50 p-10 rounded-2xl border-2 border-gantly-blue-200 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-glow-blue">
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-white shadow-card bg-slate-200 flex items-center justify-center text-5xl flex-shrink-0">
              {psychologistProfile.avatarUrl ? (
                <img
                  src={psychologistProfile.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-2xl">
                  PS
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-bold text-gantly-text mb-2">
                {psychologistProfile.name}
              </h3>
              <div className="text-lg text-gray-500 mb-3">
                {psychologistProfile.email}
              </div>
            </div>
          </div>

          {/* Biografia */}
          {psychologistProfile.bio && (
            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-xl font-semibold text-gantly-text mb-4">
                Sobre mi
              </h3>
              <p className="text-base leading-relaxed text-gantly-muted">
                {psychologistProfile.bio}
              </p>
            </div>
          )}

          {/* Educacion */}
          {psychologistProfile.education && (() => {
            try {
              const education = JSON.parse(psychologistProfile.education);
              if (Array.isArray(education) && education.length > 0) {
                return (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-semibold text-gantly-text mb-5">
                      Educacion
                    </h3>
                    <div className="flex flex-col gap-4">
                      {education.map((edu: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-white rounded-xl border border-slate-200"
                        >
                          <div className="text-lg font-semibold text-gantly-text mb-1">
                            {edu.degree || 'Titulo'}{' '}
                            {edu.field ? `en ${edu.field}` : ''}
                          </div>
                          <div className="text-base text-gantly-blue-500 mb-1">
                            {edu.institution || 'Institucion'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {edu.startDate && edu.endDate
                              ? `${edu.startDate} - ${edu.endDate}`
                              : edu.startDate ||
                                edu.endDate ||
                                ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {
              // ignore parse errors
            }
            return null;
          })()}

          {/* Certificaciones */}
          {psychologistProfile.certifications && (() => {
            try {
              const certs = JSON.parse(
                psychologistProfile.certifications,
              );
              if (Array.isArray(certs) && certs.length > 0) {
                return (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-semibold text-gantly-text mb-5">
                      Certificaciones
                    </h3>
                    <div className="flex flex-col gap-4">
                      {certs.map((cert: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-white rounded-xl border border-slate-200"
                        >
                          <div className="text-lg font-semibold text-gantly-text mb-1">
                            {cert.name || 'Certificacion'}
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Emitido por: {cert.issuer || 'N/A'}
                          </div>
                          {cert.date && (
                            <div className="text-sm text-gray-500 mb-1">
                              Fecha: {cert.date}
                            </div>
                          )}
                          {cert.credentialId && (
                            <div className="text-xs text-slate-400 font-mono">
                              ID: {cert.credentialId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}

          {/* Experiencia */}
          {psychologistProfile.experience && (() => {
            try {
              const experience = JSON.parse(
                psychologistProfile.experience,
              );
              if (Array.isArray(experience) && experience.length > 0) {
                return (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-semibold text-gantly-text mb-5">
                      Experiencia profesional
                    </h3>
                    <div className="flex flex-col gap-4">
                      {experience.map((exp: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-white rounded-xl border border-slate-200"
                        >
                          <div className="text-lg font-semibold text-gantly-text mb-1">
                            {exp.title || 'Cargo'}
                          </div>
                          <div className="text-base text-gantly-blue-500 mb-1">
                            {exp.company || 'Empresa'}
                          </div>
                          {exp.description && (
                            <div className="text-sm text-gantly-muted mt-2 leading-relaxed">
                              {exp.description}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 mt-2">
                            {exp.startDate && exp.endDate
                              ? `${exp.startDate} - ${exp.endDate}`
                              : exp.startDate
                              ? `Desde ${exp.startDate}`
                              : exp.endDate
                              ? `Hasta ${exp.endDate}`
                              : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {}
            return null;
          })()}
        </>
      )}
    </div>
  );
};

export default UserPsychProfileTab;
