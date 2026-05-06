import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Users, User, Stethoscope } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api, { profileService, psychService } from '../services/api';
import { toast } from './ui/Toast';

// Obtener la URL base para WebSocket (sin /api)
const WS_BASE_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  // Remover /api si existe, y usar la base
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
})();

type Props = {
  mode: 'USER' | 'PSYCHOLOGIST';
  otherId?: number; // requerido si PSYCHOLOGIST (userId del paciente)
};

type Message = {
  id?: number;
  content: string;
  sender: 'USER' | 'PSYCHOLOGIST';
  createdAt?: string;
  psychologistId?: number;
  userId?: number;
};

const INITIAL_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

export default function ChatWidget({ mode, otherId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [psychId, setPsychId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);

  useEffect(() => {
    // Limpiar conexión anterior solo si cambian los IDs
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setConnected(false);
    // NO resetear mensajes aquí - se cargarán del historial

    (async () => {
      const me = await profileService.me();
      setCurrentUser(me); // Guardar perfil del usuario actual
      if (mode === 'USER') {
        setUserId(me.id);
        const rel = await profileService.myPsychologist();
        if (rel.status === 'ASSIGNED') {
          setPsychId(rel.psychologist!.id);
          setOtherUser(rel.psychologist);
          
          // SIEMPRE cargar historial primero antes de conectar
          try {
            const { data } = await api.get(`/chat/history`);
            if (Array.isArray(data) && data.length > 0) {
              const reversed = [...data].reverse();
              setMessages(reversed);
            } else {
              setMessages([]);
            }
          } catch (e) {
            setMessages([]);
          }
          
          // Conectar con psicólogoId primero, luego userId
          connect(rel.psychologist!.id, me.id);
        } else {
          // No hay psicólogo asignado
          setMessages([]);
        }
      } else {
        // psicólogo
        setPsychId(me.id);
        if (otherId) {
          setUserId(otherId);
          // Cargar información del paciente usando el servicio que resuelve URLs
          try {
            const patients = await psychService.patients();
            const patient = patients.find((p: any) => p.id === otherId);
            if (patient) setOtherUser(patient);
          } catch (e) {
            // error handled silently
          }
          
          // SIEMPRE cargar historial primero antes de conectar
          try {
            const { data } = await api.get(`/chat/history`, { params: { userId: otherId } });
            if (Array.isArray(data) && data.length > 0) {
              const reversed = [...data].reverse();
              setMessages(reversed);
            } else {
              setMessages([]);
            }
          } catch (e) {
            setMessages([]);
          }
          
          // Conectar con psicólogoId primero (me.id), luego userId (otherId)
          connect(me.id, otherId);
        } else {
          // No hay paciente seleccionado
          setMessages([]);
        }
      }
    })();
    
    return () => { 
      // Solo desconectar si realmente cambian los parámetros de conexión
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [mode, otherId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const connect = (psychologistId: number, uId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Reset reconnect delay for new connection attempt
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

    const client = new Client({
      webSocketFactory: () => {
        const socket = new SockJS(`${WS_BASE_URL}/ws`);
        return socket;
      },
      reconnectDelay: reconnectDelayRef.current,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: () => {},
    });

    // Override beforeConnect to apply exponential backoff
    client.beforeConnect = () => {
      client.reconnectDelay = reconnectDelayRef.current;
    };

    client.onConnect = () => {
      setConnected(true);
      setReconnecting(false);
      // Reset delay on successful connection
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      const topic = `/topic/chat/${psychologistId}/${uId}`;

      client.subscribe(topic, (msg: IMessage) => {
        try {
          const message = JSON.parse(msg.body);

          setMessages(prev => {
            // Buscar si hay un mensaje optimista temporal con el mismo contenido
            const tempIndex = prev.findIndex(m =>
              m.id && m.id > 1000000000000 && // IDs temporales son timestamps grandes
              m.content === message.content &&
              m.sender === message.sender
            );

            if (tempIndex !== -1) {
              const newMessages = [...prev];
              newMessages[tempIndex] = message;
              return newMessages;
            }

            // Evitar duplicados: verificar por ID primero
            const exists = prev.some(m => {
              if (m.id && message.id && m.id === message.id) {
                return true;
              }
              // Si no hay ID, verificar por contenido y timestamp (dentro de 5 segundos)
              if (m.content === message.content && m.createdAt && message.createdAt) {
                const mTime = new Date(m.createdAt).getTime();
                const msgTime = new Date(message.createdAt).getTime();
                if (Math.abs(mTime - msgTime) < 5000) {
                  return true;
                }
              }
              return false;
            });

            if (exists) {
              return prev;
            }

            const newMessages = [...prev, message];
            return newMessages;
          });
        } catch (e) {
          // error handled silently
        }
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
      setReconnecting(true);
      // Exponential backoff: double the delay, cap at MAX_RECONNECT_DELAY
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
    };

    client.onStompError = () => {
      setConnected(false);
      setReconnecting(true);
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
    };

    client.onWebSocketError = () => {
      setReconnecting(true);
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
    };

    client.onWebSocketClose = () => {
      setConnected(false);
      setReconnecting(true);
    };

    client.activate();
    clientRef.current = client;
  };

  const send = async () => {
    if (!input.trim()) {
      return;
    }

    if (!connected) {
      toast.warning('No estás conectado. Por favor espera a que se establezca la conexión.');
      return;
    }

    if (psychId == null || userId == null) {
      return;
    }
    
    const messageContent = input.trim();
    const tempId = Date.now(); // ID temporal para el mensaje optimista
    setSending(true);
    
    // Agregar mensaje optimista inmediatamente
    const tempMessage: Message = {
      id: tempId,
      content: messageContent,
      sender: mode === 'USER' ? 'USER' : 'PSYCHOLOGIST',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);
    setInput('');
    
    try {
      const messageData = { content: messageContent };
      const destination = `/app/chat/${psychId}/${userId}`;

      if (!clientRef.current || !clientRef.current.connected) {
        toast.error('Error: No estás conectado al servidor. Por favor recarga la página.');
        // Remover mensaje optimista si falla
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return;
      }
      
      clientRef.current.publish({
        destination: destination,
        body: JSON.stringify(messageData),
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // El mensaje optimista será reemplazado por el mensaje real cuando llegue del servidor
      // o removido si hay un error
      
    } catch (e) {
      toast.error('Error al enviar el mensaje. Intenta de nuevo.');
      // Remover mensaje optimista si falla
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (diff < 86400000) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + 
           date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (mode === 'USER' && psychId == null) {
    return (
      <div className="p-10 text-center bg-gradient-to-r from-gantly-blue-500 to-gantly-cyan-500 rounded-xl text-white">
        <MessageCircle className="w-12 h-12 text-white/80 mb-4 mx-auto" />
        <h3 className="font-heading text-xl font-semibold mb-2">Esperando asignación</h3>
        <p className="opacity-90">Un administrador te asignará un psicólogo pronto</p>
      </div>
    );
  }
  
  if (mode === 'PSYCHOLOGIST' && otherId == null) {
    return (
      <div className="p-10 text-center bg-gradient-to-r from-gantly-blue-500 to-gantly-cyan-500 rounded-xl text-white">
        <Users className="w-12 h-12 text-white/80 mb-4 mx-auto" />
        <h3 className="font-heading text-xl font-semibold mb-2">Selecciona un paciente</h3>
        <p className="opacity-90">Elige un paciente de la lista para comenzar a chatear</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] w-full bg-white rounded-xl shadow-card overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gantly-blue-500 to-gantly-cyan-500 px-5 py-4 text-white flex items-center gap-3">
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          overflow: 'hidden'
        }}>
          {otherUser?.avatarUrl ? (
            <img 
              src={otherUser.avatarUrl} 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.textContent = otherUser?.name?.charAt(0)?.toUpperCase() || '?';
                  parent.style.fontSize = '20px';
                  parent.style.display = 'flex';
                  parent.style.alignItems = 'center';
                  parent.style.justifyContent = 'center';
                }
              }}
            />
          ) : (
            <User size={16} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>{otherUser?.name || 'Usuario'}</div>
          <div style={{ fontSize: '12px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#34c759' : '#ff9500',
              display: 'inline-block'
            }}></div>
            {connected ? 'En línea' : reconnecting ? 'Reconectando...' : 'Conectando...'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}><MessageCircle size={32} color="#9ca3af" /></div>
            <div>No hay mensajes aún. ¡Comienza la conversación!</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#9ca3af' }}>
              Modo: {mode} | Conectado: {connected ? 'Sí' : 'No'} | PsychId: {psychId || 'N/A'} | UserId: {userId || 'N/A'}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '11px', color: '#9ca3af', padding: '4px 8px', textAlign: 'center' }}>
              Mostrando {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
            </div>
            {messages.map((m, idx) => {
              const isMe = m.sender === (mode === 'USER' ? 'USER' : 'PSYCHOLOGIST');
              // Usar ID del mensaje si está disponible, sino usar índice + contenido como fallback
              const messageKey = m.id ? `msg-${m.id}` : `msg-temp-${idx}-${m.content?.substring(0, 10)}`;
              return (
                <div key={messageKey} style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}>
                  {!isMe && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {otherUser?.avatarUrl ? (
                        <img 
                          src={otherUser.avatarUrl} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.textContent = otherUser?.name?.charAt(0)?.toUpperCase() || '?';
                              parent.style.fontSize = '14px';
                              parent.style.display = 'flex';
                              parent.style.alignItems = 'center';
                              parent.style.justifyContent = 'center';
                            }
                          }}
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      background: isMe
                        ? '#2E93CC'
                        : '#f1f5f9',
                      color: isMe ? 'white' : '#1f2937',
                      padding: '10px 14px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordBreak: 'break-word'
                    }}>
                      {m.content}
                    </div>
                    {m.createdAt && (
                      <div style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginTop: '4px',
                        padding: '0 4px'
                      }}>
                        {formatTime(m.createdAt)}
                      </div>
                    )}
                  </div>
                  {isMe && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: currentUser?.avatarUrl ? 'transparent' : '#2E93CC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {currentUser?.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.textContent = currentUser?.name?.charAt(0)?.toUpperCase() || '?';
                              parent.style.background = '#2E93CC';
                              parent.style.display = 'flex';
                              parent.style.alignItems = 'center';
                              parent.style.justifyContent = 'center';
                            }
                          }}
                        />
                      ) : (
                        mode === 'USER' ? <User size={16} /> : <Stethoscope size={16} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={connected ? "Escribe un mensaje..." : "Conectando..."}
          disabled={!connected || sending}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            minHeight: '44px',
            maxHeight: '120px',
            background: connected ? '#ffffff' : '#f9fafb',
            color: connected ? '#1f2937' : '#9ca3af',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            if (connected) {
              e.target.style.borderColor = '#2E93CC';
              e.target.style.boxShadow = '0 0 0 3px rgba(46, 147, 204, 0.1)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={send}
          disabled={!connected || sending || !input.trim()}
          style={{
            padding: '12px 24px',
            background: connected && input.trim()
              ? '#2E93CC'
              : '#e5e7eb',
            color: connected && input.trim() ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            minWidth: '80px'
          }}
          onMouseEnter={(e) => {
            if (connected && input.trim()) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
