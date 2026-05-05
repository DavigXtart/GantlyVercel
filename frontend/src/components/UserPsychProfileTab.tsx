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
    <div className="max-w-[900px] mx-auto">
      {loadingPsychologistProfile ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gantly-blue/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="material-symbols-outlined text-gantly-blue text-2xl">person</span>
          </div>
          <p className="text-sm font-body text-gantly-muted">
            Cargando perfil del psicólogo...
          </p>
        </div>
      ) : (
        <>
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="text-sm text-gantly-blue hover:text-gantly-navy cursor-pointer transition-all duration-200 flex items-center gap-1 hover:bg-gantly-ice px-3 py-2 rounded-xl"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver
            </button>
          </div>

          {/* Profile hero header */}
          <div className="rounded-2xl overflow-hidden mb-6 border border-slate-100 shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-gantly-blue via-gantly-cyan to-gantly-emerald"></div>
            <div className="p-8 md:p-10" style={{ background: 'linear-gradient(135deg, #1B6FA0 0%, #2E93CC 30%, #48C6D4 65%, #78D4B0 100%)' }}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-4 ring-white/20 shadow-xl">
                  {psychologistProfile.avatarUrl ? (
                    <img
                      src={psychologistProfile.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white font-heading font-bold">
                      {psychologistProfile.name ? psychologistProfile.name.charAt(0).toUpperCase() : 'P'}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-heading font-bold text-white mb-1">
                    {psychologistProfile.name}
                  </h3>
                  <p className="text-sm font-body text-white/70">
                    {psychologistProfile.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {psychologistProfile.bio && (
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-gantly-blue p-6 mb-4 shadow-sm hover:shadow-md transition-all duration-200">
              <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gantly-blue/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gantly-blue text-sm">person</span>
                </span>
                Sobre mí
              </h3>
              <p className="text-sm font-body text-gantly-muted leading-relaxed">
                {psychologistProfile.bio}
              </p>
            </div>
          )}

          {/* Education */}
          {psychologistProfile.education && (() => {
            try {
              const education = JSON.parse(psychologistProfile.education);
              if (Array.isArray(education) && education.length > 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-gantly-cyan p-6 mb-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-gantly-cyan/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gantly-cyan text-sm">school</span>
                      </span>
                      Educación
                    </h3>
                    <div className="space-y-3">
                      {education.map((edu: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-gantly-cloud/50 rounded-xl border border-slate-100 hover:border-gantly-cyan/20 transition-all duration-200"
                        >
                          <p className="text-sm font-body font-semibold text-gantly-text mb-0.5">
                            {edu.degree || 'Título'}{' '}
                            {edu.field ? `en ${edu.field}` : ''}
                          </p>
                          <p className="text-sm font-body text-gantly-blue">
                            {edu.institution || 'Institución'}
                          </p>
                          <p className="text-xs font-body text-gantly-muted mt-1">
                            {edu.startDate && edu.endDate
                              ? `${edu.startDate} - ${edu.endDate}`
                              : edu.startDate ||
                                edu.endDate ||
                                ''}
                          </p>
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

          {/* Certifications */}
          {psychologistProfile.certifications && (() => {
            try {
              const certs = JSON.parse(
                psychologistProfile.certifications,
              );
              if (Array.isArray(certs) && certs.length > 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-gantly-gold p-6 mb-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-gantly-gold/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gantly-gold text-sm">workspace_premium</span>
                      </span>
                      Certificaciones
                    </h3>
                    <div className="space-y-3">
                      {certs.map((cert: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-gantly-cloud/50 rounded-xl border border-slate-100 hover:border-gantly-gold/20 transition-all duration-200"
                        >
                          <p className="text-sm font-body font-semibold text-gantly-text mb-0.5">
                            {cert.name || 'Certificación'}
                          </p>
                          <p className="text-xs font-body text-gantly-muted mb-0.5">
                            Emitido por: {cert.issuer || 'N/A'}
                          </p>
                          {cert.date && (
                            <p className="text-xs font-body text-gantly-muted">
                              Fecha: {cert.date}
                            </p>
                          )}
                          {cert.credentialId && (
                            <p className="text-xs font-body text-gantly-muted/70 font-mono mt-1">
                              ID: {cert.credentialId}
                            </p>
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

          {/* Experience */}
          {psychologistProfile.experience && (() => {
            try {
              const experience = JSON.parse(
                psychologistProfile.experience,
              );
              if (Array.isArray(experience) && experience.length > 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-gantly-emerald p-6 mb-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <h3 className="text-sm font-heading font-semibold text-gantly-text uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-gantly-emerald/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gantly-emerald text-sm">work</span>
                      </span>
                      Experiencia profesional
                    </h3>
                    <div className="space-y-3">
                      {experience.map((exp: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-gantly-cloud/50 rounded-xl border border-slate-100 hover:border-gantly-emerald/20 transition-all duration-200"
                        >
                          <p className="text-sm font-body font-semibold text-gantly-text mb-0.5">
                            {exp.title || 'Cargo'}
                          </p>
                          <p className="text-sm font-body text-gantly-emerald">
                            {exp.company || 'Empresa'}
                          </p>
                          {exp.description && (
                            <p className="text-sm font-body text-gantly-muted mt-2 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                          <p className="text-xs font-body text-gantly-muted mt-2">
                            {exp.startDate && exp.endDate
                              ? `${exp.startDate} - ${exp.endDate}`
                              : exp.startDate
                              ? `Desde ${exp.startDate}`
                              : exp.endDate
                              ? `Hasta ${exp.endDate}`
                              : ''}
                          </p>
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
