import { User } from 'lucide-react';
import ChatWidget from './ChatWidget';

interface PsychChatTabProps {
  patients: any[];
  selectedPatient: number | null;
  onSelectPatient: (patientId: number) => void;
}

export default function PsychChatTab({
  patients,
  selectedPatient,
  onSelectPatient,
}: PsychChatTabProps) {
  return (
    <div className="flex gap-4 items-start">
      {/* Patient selector sidebar */}
      <div className="w-72 bg-white rounded-xl border border-slate-200/80 max-h-[600px] overflow-y-auto flex-shrink-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <h4 className="m-0 text-[11px] font-medium text-slate-500 uppercase tracking-wide">Seleccionar Paciente</h4>
        </div>
        <div className="p-3">
          {patients.length === 0 ? (
            <div className="text-center py-5 text-slate-500 text-sm">
              Aun no tienes pacientes asignados. Completa tu perfil y el test de matching para empezar a recibir pacientes.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {patients.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-3 ${
                    selectedPatient === p.id
                      ? 'bg-gantly-blue/10 text-gantly-blue'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${selectedPatient === p.id ? 'text-gantly-blue' : 'text-slate-800'}`}>{p.name}</div>
                    <div className={`text-[11px] truncate ${selectedPatient === p.id ? 'text-gantly-blue/60' : 'text-slate-500'}`}>{p.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat widget */}
      <div className="flex-1 min-w-0">
        <ChatWidget mode="PSYCHOLOGIST" otherId={selectedPatient || undefined} />
      </div>
    </div>
  );
}
