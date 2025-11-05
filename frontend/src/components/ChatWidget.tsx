import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api, { profileService } from '../services/api';

type Props = {
  mode: 'USER' | 'PSYCHOLOGIST';
  otherId?: number; // requerido si PSYCHOLOGIST (userId del paciente)
};

export default function ChatWidget({ mode, otherId }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [psychId, setPsychId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const me = await profileService.me();
      if (mode === 'USER') {
        setUserId(me.id);
        const rel = await profileService.myPsychologist();
        if (rel.status === 'ASSIGNED') {
          setPsychId(rel.psychologist!.id);
          const { data } = await api.get(`/chat/history`);
          setMessages([...data].reverse());
          connect(rel.psychologist!.id, me.id);
        }
      } else {
        // psicólogo
        setPsychId(me.id);
        if (otherId) {
          setUserId(otherId);
          const { data } = await api.get(`/chat/history`, { params: { userId: otherId } });
          setMessages([...data].reverse());
          connect(me.id, otherId);
        }
      }
    })();
    return () => { clientRef.current?.deactivate(); };
  }, [mode, otherId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const connect = (psychologistId: number, uId: number) => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
    });
    client.onConnect = () => {
      client.subscribe(`/topic/chat/${psychologistId}/${uId}`, (msg: IMessage) => {
        try { setMessages(prev => [...prev, JSON.parse(msg.body)]); } catch { /* ignore */ }
      });
    };
    client.activate();
    clientRef.current = client;
  };

  const send = () => {
    if (!input.trim() || clientRef.current?.connected !== true || psychId == null || userId == null) return;
    clientRef.current!.publish({ destination: `/app/chat/${psychId}/${userId}`, body: JSON.stringify({ content: input }) });
    setInput('');
  };

  if (mode === 'USER' && psychId == null) {
    return <div>Estás a la espera de asignación de psicólogo.</div>;
  }
  if (mode === 'PSYCHOLOGIST' && otherId == null) {
    return <div>Selecciona un paciente para chatear.</div>;
  }

  return (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12, maxWidth: 600 }}>
      <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 8, display: 'flex', justifyContent: m.sender === 'PSYCHOLOGIST' ? 'flex-start' : 'flex-end' }}>
            <div style={{ background: '#f5f5f7', borderRadius: 8, padding: '6px 10px', maxWidth: '75%' }}>
              <div style={{ fontSize: 12, color: '#555' }}>{m.sender === 'PSYCHOLOGIST' ? 'Psicólogo' : 'Yo'}</div>
              <div>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe un mensaje" style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={send}>Enviar</button>
      </div>
    </div>
  );
}


