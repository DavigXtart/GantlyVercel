import { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, MessageCircle, Send } from 'lucide-react';
import { patientClinicChatService } from '../services/api';
import { toast } from './ui/Toast';

interface UserClinicChatTabProps {
  hasClinic: boolean;
}

type ChatMessage = { id: number; sender: string; content: string; createdAt: string };

export default function UserClinicChatTab({ hasClinic }: UserClinicChatTabProps) {
  const [clinicChatMessages, setClinicChatMessages] = useState<ChatMessage[]>([]);
  const [clinicChatInput, setClinicChatInput] = useState('');
  const [clinicChatSending, setClinicChatSending] = useState(false);
  const [clinicChatLoading, setClinicChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Track latest message timestamp in a ref to avoid stale closure
  const lastTimestampRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Update ref whenever messages change
  useEffect(() => {
    if (clinicChatMessages.length > 0) {
      lastTimestampRef.current = clinicChatMessages[clinicChatMessages.length - 1].createdAt;
    }
  }, [clinicChatMessages]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [clinicChatMessages, scrollToBottom]);

  // Initial load + polling every 5 seconds
  useEffect(() => {
    if (!hasClinic) return;

    let cancelled = false;

    const loadAll = async () => {
      try {
        const msgs = await patientClinicChatService.getMessages();
        if (!cancelled) setClinicChatMessages(msgs);
      } catch {
        // silently ignore
      }
    };

    const pollNew = async () => {
      try {
        const after = lastTimestampRef.current;
        if (after) {
          const newMsgs = await patientClinicChatService.getMessages(after);
          if (!cancelled && newMsgs.length > 0) {
            setClinicChatMessages((prev) => [...prev, ...newMsgs]);
          }
        } else {
          await loadAll();
        }
      } catch {
        // silently ignore
      }
    };

    setClinicChatLoading(true);
    loadAll().finally(() => { if (!cancelled) setClinicChatLoading(false); });

    const interval = setInterval(pollNew, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hasClinic]);

  const handleSendClinicChat = async () => {
    if (!clinicChatInput.trim() || clinicChatSending) return;
    setClinicChatSending(true);
    try {
      const msg = await patientClinicChatService.sendMessage(clinicChatInput.trim());
      setClinicChatMessages((prev) => [...prev, msg]);
      setClinicChatInput('');
    } catch {
      toast.error('Error al enviar el mensaje');
    } finally {
      setClinicChatSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header with gradient accent */}
      <div className="h-1 bg-gradient-to-r from-gantly-blue to-gantly-cyan" />
      <div className="px-6 md:px-8 pt-6 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gantly-blue/10 to-gantly-cyan/10 flex items-center justify-center">
          <Building2 size={20} className="text-gantly-blue" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-gantly-text">
            Mensajes de tu clinica
          </h2>
          <p className="text-xs text-slate-500 font-body">Chat directo con tu clinica</p>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-6">
        {clinicChatLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-slate-200 border-t-gantly-blue rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Messages list */}
            <div
              ref={messagesContainerRef}
              className="space-y-3 max-h-[500px] overflow-y-auto mb-6 pr-2"
            >
              {clinicChatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={32} className="text-slate-200 mb-3 mx-auto block" />
                  <p className="text-slate-500 text-sm font-body">
                    No hay mensajes todavia. Escribe el primer mensaje a tu clinica.
                  </p>
                </div>
              ) : (
                clinicChatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'PATIENT' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 ${
                        msg.sender === 'PATIENT'
                          ? 'bg-gradient-to-r from-gantly-blue to-gantly-blue/90 text-white rounded-2xl rounded-br-sm shadow-sm'
                          : 'bg-slate-50 text-gantly-text rounded-2xl rounded-bl-sm border border-slate-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'PATIENT' ? 'text-white/60' : 'text-slate-500'}`}>
                        {new Date(msg.createdAt).toLocaleString('es-ES', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-3 items-end">
              <textarea
                value={clinicChatInput}
                onChange={(e) => setClinicChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendClinicChat();
                  }
                }}
                placeholder="Escribe un mensaje..."
                rows={2}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-gantly-text placeholder-slate-400 focus:ring-2 focus:ring-gantly-blue/10 focus:border-gantly-blue outline-none transition-all duration-200 resize-none font-body text-sm"
              />
              <button
                onClick={handleSendClinicChat}
                disabled={!clinicChatInput.trim() || clinicChatSending}
                className="px-5 py-3 bg-gradient-to-r from-gantly-blue to-gantly-cyan text-white rounded-xl font-heading font-bold shadow-md hover:shadow-lg hover:shadow-gantly-blue/25 cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-none"
              >
                {clinicChatSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
