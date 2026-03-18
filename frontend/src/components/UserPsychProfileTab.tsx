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
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 6px 20px rgba(45, 74, 62, 0.12)',
        padding: '40px',
        border: '1px solid rgba(90, 146, 112, 0.15)',
        maxWidth: '900px',
        margin: '40px auto 0',
      }}
    >
      {loadingPsychologistProfile ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Cargando perfil del psicólogo...
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a2e22',
              }}
            >
              Perfil del Psicólogo
            </h2>
            <button
              onClick={onBack}
              style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Volver
            </button>
          </div>

          {/* Header del perfil */}
          <div
            style={{
              background:
                'linear-gradient(135deg, #f0f5f3 0%, #e8f0ed 100%)',
              padding: '40px',
              borderRadius: '20px',
              border: '2px solid rgba(90, 146, 112, 0.3)',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              boxShadow: '0 4px 16px rgba(90, 146, 112, 0.15)',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid white',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                flexShrink: 0,
              }}
            >
              {psychologistProfile.avatarUrl ? (
                <img
                  src={psychologistProfile.avatarUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '24px',
                  }}
                >
                  PS
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#1f2937',
                }}
              >
                {psychologistProfile.name}
              </h3>
              <div
                style={{
                  fontSize: '18px',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}
              >
                {psychologistProfile.email}
              </div>
            </div>
          </div>

          {/* Biografía */}
          {psychologistProfile.bio && (
            <div
              style={{
                marginBottom: '32px',
                padding: '24px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1f2937',
                }}
              >
                Sobre mí
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#4b5563',
                }}
              >
                {psychologistProfile.bio}
              </p>
            </div>
          )}

          {/* Educación */}
          {psychologistProfile.education && (() => {
            try {
              const education = JSON.parse(psychologistProfile.education);
              if (Array.isArray(education) && education.length > 0) {
                return (
                  <div
                    style={{
                      marginBottom: '32px',
                      padding: '24px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1f2937',
                      }}
                    >
                      Educación
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      {education.map((edu: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '16px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#1f2937',
                              marginBottom: '4px',
                            }}
                          >
                            {edu.degree || 'Título'}{' '}
                            {edu.field ? `en ${edu.field}` : ''}
                          </div>
                          <div
                            style={{
                              fontSize: '16px',
                              color: '#667eea',
                              marginBottom: '4px',
                            }}
                          >
                            {edu.institution || 'Institución'}
                          </div>
                          <div
                            style={{ fontSize: '14px', color: '#6b7280' }}
                          >
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
                  <div
                    style={{
                      marginBottom: '32px',
                      padding: '24px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1f2937',
                      }}
                    >
                      Certificaciones
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      {certs.map((cert: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '16px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#1f2937',
                              marginBottom: '4px',
                            }}
                          >
                            {cert.name || 'Certificación'}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              marginBottom: '4px',
                            }}
                          >
                            Emitido por: {cert.issuer || 'N/A'}
                          </div>
                          {cert.date && (
                            <div
                              style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                marginBottom: '4px',
                              }}
                            >
                              Fecha: {cert.date}
                            </div>
                          )}
                          {cert.credentialId && (
                            <div
                              style={{
                                fontSize: '13px',
                                color: '#9ca3af',
                                fontFamily: 'monospace',
                              }}
                            >
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
                  <div
                    style={{
                      marginBottom: '32px',
                      padding: '24px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1f2937',
                      }}
                    >
                      Experiencia profesional
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      {experience.map((exp: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '16px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: '#1f2937',
                              marginBottom: '4px',
                            }}
                          >
                            {exp.title || 'Cargo'}
                          </div>
                          <div
                            style={{
                              fontSize: '16px',
                              color: '#667eea',
                              marginBottom: '4px',
                            }}
                          >
                            {exp.company || 'Empresa'}
                          </div>
                          {exp.description && (
                            <div
                              style={{
                                fontSize: '14px',
                                color: '#4b5563',
                                marginTop: '8px',
                                lineHeight: '1.6',
                              }}
                            >
                              {exp.description}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              marginTop: '8px',
                            }}
                          >
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
