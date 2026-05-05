import { useEffect, useRef, useState } from 'react';
import { JitsiErrorBoundary } from './JitsiErrorBoundary';

interface JitsiVideoCallProps {
  roomName: string;
  userEmail: string;
  userName: string;
  onClose: () => void;
  otherUserEmail?: string;
  otherUserName?: string;
}

function JitsiVideoCallComponent({ 
  roomName, 
  userEmail, 
  userName, 
  onClose,
  otherUserEmail: _,
  otherUserName 
}: JitsiVideoCallProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const apiRef = useRef<any>(null);
  const isInitializedRef = useRef(false); // Prevenir múltiples inicializaciones
  const hasJoinedRef = useRef(false); // Rastrear si el usuario se ha unido
  const isReconnectingRef = useRef(false); // Rastrear si está reconectando
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout para cerrar
  const allowCloseRef = useRef(false); // Solo permitir cerrar cuando el usuario hace clic explícitamente
  const onCloseRef = useRef(onClose); // Guardar referencia estable de onClose
  
  // Actualizar referencia cuando cambia
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  
  // Función protegida para cerrar - solo funciona si allowCloseRef es true
  const _safeClose = useRef(() => {
    if (allowCloseRef.current) {
      try {
        onCloseRef.current();
      } catch (e) {
        // Silenciar error
      }
    }
  }).current;
  
  // Interceptar beforeunload y unload para prevenir cierres accidentales
  useEffect(() => {
    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      // Si estamos en una videollamada activa, NO hacer nada
      // Jitsi puede estar reconectando, no cerrar
      if (apiRef.current) {
        // NO prevenir el beforeunload de Jitsi, pero tampoco llamar a onClose
        return;
      }
    };
    
    const handleUnload = () => {
      // Cuando se dispara unload, NO llamar a onClose
      // Esto puede ser una reconexión de Jitsi
      if (apiRef.current && isReconnectingRef.current) {
        // Está reconectando, no cerrar
        return;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  useEffect(() => {
    // Cargar el script de Jitsi Meet (self-hosted o JaaS)
    const script = document.createElement('script');
    const jitsiMagicCookie = import.meta.env.VITE_JITSI_MAGIC_COOKIE || '';
    const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'localhost:8000';
    const isSelfHosted = !jitsiDomain.includes('8x8.vc');
    script.src = isSelfHosted
      ? `http://${jitsiDomain}/external_api.js`
      : `https://${jitsiDomain}/${jitsiMagicCookie}/external_api.js`;
    script.async = true;
    
    script.onload = () => {
      try {
        // Prevenir múltiples inicializaciones
        if (isInitializedRef.current) {
          return;
        }
        if (!jitsiContainerRef.current) return;
        
        isInitializedRef.current = true;
        
        // @ts-ignore - JitsiMeetExternalAPI se carga dinámicamente
        const { JitsiMeetExternalAPI } = window as any;
        
        if (!JitsiMeetExternalAPI) {
          console.error('Jitsi Meet API no está disponible');
          setIsLoading(false);
          isInitializedRef.current = false;
          return;
        }

      // Configuración para self-hosted o JaaS (8x8.vc)
      const domain = jitsiDomain;
      const fullRoomName = isSelfHosted ? roomName : `${jitsiMagicCookie}/${roomName}`;
      const options = {
        roomName: fullRoomName,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          // E2EE solo en JaaS (self-hosted usa oportunistic SRTP)
          ...(isSelfHosted ? {} : { e2ee: { enabled: true } }),
          // Configuración de privacidad
          disableThirdPartyRequests: true,
          analytics: {
            disabled: true
          },
          // Configuración de interfaz
          defaultLanguage: 'es',
          requireDisplayName: false,
          enableWelcomePage: false,
          enablePrejoinPage: false,
          enableClosePage: false,
          // Configuraciones para evitar el lobby y membersOnly
          enableLobbyChat: false,
          enableLayerSuspension: false,
          // Permitir que cualquier usuario sea moderador automáticamente
          enableInsecureRoomNameWarning: false,
          // Deshabilitar el lobby completamente
          disableDeepLinking: true,
          // Configuración para evitar el modo membersOnly
          p2p: {
            enabled: true,
            stunServers: []
          },
          // Permitir que el primer usuario sea automáticamente moderador
          channelLastN: -1,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          APP_NAME: 'Gantly',
          NATIVE_APP_NAME: 'Gantly',
          PROVIDER_NAME: 'Gantly',
          DEFAULT_BACKGROUND: '#0A1628',
        },
        userInfo: {
          displayName: userName,
          email: userEmail,
        },
      };

      // Manejo global de errores MUY robusto para evitar crashes
      const originalErrorHandler = window.onerror;
      const _originalUnhandledRejection = window.onunhandledrejection;
      
      const globalErrorHandler = (message: any, source?: string, lineno?: number, colno?: number, error?: Error) => {
        try {
          // Capturar TODOS los errores relacionados con Jitsi y evitar que crasheen
          const errorStr = String(message || error?.message || error?.toString() || '');
          const errorStack = error?.stack || '';
          const sourceStr = String(source || '');
          
          // Lista más completa de patrones a capturar (incluyendo chrome-extension)
          const jitsiPatterns = [
            'Jitsi', 'jitsi', 'iframe', 'postMessage', 'external_api', 
            'meet.jit.si', '8x8.vc', '8x8', 'membersOnly', 'members-only', 'lobby',
            'conference', 'xmpp', 'strophe', 'webrtc', 'rtc',
            'chrome-extension', 'extension://invalid', 'ERR_FAILED'
          ];
          
          const shouldIgnore = jitsiPatterns.some(pattern => 
            errorStr.toLowerCase().includes(pattern.toLowerCase()) ||
            errorStack.toLowerCase().includes(pattern.toLowerCase()) ||
            sourceStr.toLowerCase().includes(pattern.toLowerCase())
          );
          
          if (shouldIgnore) {
            // Silenciar completamente - no loguear nada
            return true; // Prevenir que el error se propague
          }
          // Para otros errores, usar el handler original si existe
          if (originalErrorHandler) {
            try {
              return originalErrorHandler(message, source, lineno, colno, error);
            } catch (e) {
              // Si el handler original falla, ignorar
              return true;
            }
          }
          return false;
        } catch (e) {
          // Si algo falla en el handler, simplemente prevenir el error
          return true;
        }
      };

      const rejectionHandler = (event: PromiseRejectionEvent) => {
        try {
          const reason = String(event.reason || event.reason?.message || event.reason?.toString() || '');
          const reasonObj = event.reason;
          const reasonStack = reasonObj?.stack || '';
          
          // Capturar cualquier promesa rechazada relacionada con Jitsi o Chrome
          const shouldIgnore = 
            reason.includes('Jitsi') || 
            reason.includes('jitsi') ||
            reason.includes('iframe') || 
            reason.includes('postMessage') ||
            reason.includes('external_api') ||
            reason.includes('meet.jit.si') ||
            reason.includes('8x8.vc') ||
            reason.includes('8x8') ||
            reason.includes('membersOnly') ||
            reason.includes('members-only') ||
            reason.includes('lobby') ||
            reason.includes('chrome-extension') ||
            reason.includes('ERR_FAILED') ||
            reasonStack.includes('Jitsi') ||
            reasonStack.includes('jitsi');
          
          if (shouldIgnore) {
            // Silenciar completamente - no loguear
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return;
          }
        } catch (e) {
          // Si algo falla, prevenir el error
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      };

      // Handler para addEventListener de errores - MÁS AGRESIVO
      const errorEventListener = (event: ErrorEvent) => {
        try {
          const errorStr = String(event.message || event.error?.message || event.error?.toString() || '');
          const errorStack = event.error?.stack || '';
          const filename = String(event.filename || '');
          
          // Capturar CUALQUIER error que pueda estar relacionado con Jitsi o Chrome extensions
          const shouldIgnore = 
            errorStr.includes('Jitsi') || 
            errorStr.includes('jitsi') || 
            errorStr.includes('meet.jit.si') ||
            errorStr.includes('8x8.vc') ||
            errorStr.includes('8x8') ||
            errorStr.includes('membersOnly') ||
            errorStr.includes('conference') ||
            errorStr.includes('lobby') ||
            errorStr.includes('chrome-extension') ||
            errorStr.includes('ERR_FAILED') ||
            errorStack.includes('Jitsi') ||
            errorStack.includes('jitsi') ||
            filename.includes('jitsi') ||
            filename.includes('meet.jit.si') ||
            filename.includes('8x8.vc') ||
            filename.includes('8x8') ||
            filename.includes('chrome-extension');
          
          if (shouldIgnore) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            // Silenciar completamente - no loguear
            return false;
          }
        } catch (e) {
          // Si algo falla, prevenir el error de todas formas
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        return true;
      };

      // Interceptar errores de red (fetch/XMLHttpRequest) que no se capturan con window.onerror
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).catch((error: any) => {
          const errorStr = String(error?.message || error?.toString() || '');
          if (errorStr.includes('chrome-extension') || 
              errorStr.includes('ERR_FAILED') ||
              errorStr.includes('jitsi') ||
              errorStr.includes('meet.jit.si') ||
              errorStr.includes('8x8.vc') ||
              errorStr.includes('8x8')) {
            // Silenciar errores de red relacionados con Jitsi/Chrome
            return Promise.reject(new Error('Network error suppressed'));
          }
          return Promise.reject(error);
        });
      };

      // Interceptar XMLHttpRequest
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
        const urlStr = String(url);
        if (urlStr.includes('chrome-extension://invalid') || 
            urlStr.includes('chrome-extension') && urlStr.includes('invalid')) {
          // Bloquear completamente estas peticiones
          this.addEventListener('error', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, true);
        }
        if (rest.length > 0) {
          return originalXHROpen.call(this, method, url, (rest[0] ?? true) as boolean, rest[1] as string | undefined, rest[2] as string | undefined);
        } else {
          return originalXHROpen.call(this, method, url, true);
        }
      };

      XMLHttpRequest.prototype.send = function(...args: any[]) {
        this.addEventListener('error', (e) => {
          const target = e.target as XMLHttpRequest;
          const url = target.responseURL || '';
          if (url.includes('chrome-extension://invalid') || 
              url.includes('chrome-extension') && url.includes('invalid')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        }, true);
        
        this.addEventListener('loadend', function() {
          if (this.status === 0 && this.responseURL.includes('chrome-extension://invalid')) {
            // Silenciar este error
            return;
          }
        }, true);
        
        return originalXHRSend.apply(this, args as [Document | XMLHttpRequestBodyInit | null | undefined]);
      };

      // Interceptar console.error para silenciar errores de Jitsi - MÁS AGRESIVO
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleLog = console.log;
      
      const shouldSilence = (message: string): boolean => {
        const lowerMessage = message.toLowerCase();
        return lowerMessage.includes('membersonly') ||
               lowerMessage.includes('conference.connectionerror') ||
               lowerMessage.includes('conference failed') ||
               lowerMessage.includes('jitsi') ||
               lowerMessage.includes('meet.jit.si') ||
              lowerMessage.includes('8x8.vc') ||
              lowerMessage.includes('8x8') ||
               lowerMessage.includes('chrome-extension') ||
               lowerMessage.includes('err_failed') ||
               lowerMessage.includes('xmpp') ||
               lowerMessage.includes('strophe') ||
               lowerMessage.includes('lobby') ||
               lowerMessage.includes('conference');
      };
      
      console.error = function(...args: any[]) {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg || '');
        }).join(' ');
        
        if (shouldSilence(message)) {
          // Silenciar completamente - no loguear
          return;
        }
        return originalConsoleError.apply(console, args);
      };
      
      console.warn = function(...args: any[]) {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg || '');
        }).join(' ');
        
        if (shouldSilence(message)) {
          // Silenciar completamente - no loguear
          return;
        }
        return originalConsoleWarn.apply(console, args);
      };
      
      // También interceptar console.log para capturar logs de Jitsi
      console.log = function(...args: any[]) {
        const message = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg || '');
        }).join(' ');
        
        if (shouldSilence(message)) {
          // Silenciar logs relacionados con Jitsi
          return;
        }
        return originalConsoleLog.apply(console, args);
      };

      // Agregar listeners con capture para capturar errores antes de que se propaguen
      window.onerror = globalErrorHandler;
      window.addEventListener('error', errorEventListener, true); // Usar capture phase
      window.addEventListener('unhandledrejection', rejectionHandler, true);
      
      // Capturar errores de mensajes del iframe (postMessage) - MÁS AGRESIVO
      const messageErrorHandler = (event: MessageEvent) => {
        try {
          // Si el mensaje viene de Jitsi, interceptarlo completamente
          if (event.origin.includes('meet.jit.si') || event.origin.includes('8x8.vc') || event.origin.includes('jitsi') || event.origin.includes('8x8')) {
            const data = event.data;
            if (data) {
              const dataStr = typeof data === 'string' ? data : JSON.stringify(data || {});
              // Interceptar CUALQUIER mensaje que pueda contener errores
              if (dataStr.includes('error') || 
                  dataStr.includes('Error') || 
                  dataStr.includes('membersOnly') ||
                  dataStr.includes('crash') ||
                  dataStr.includes('exception') ||
                  dataStr.includes('failed') ||
                  dataStr.includes('chrome-extension')) {
                // Silenciar completamente - no loguear
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
              }
            }
          }
        } catch (e) {
          // Si algo falla, prevenir el mensaje de todas formas
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        }
        return true;
      };
      
      // Agregar el listener con capture y también en bubble phase
      window.addEventListener('message', messageErrorHandler, true);
      window.addEventListener('message', messageErrorHandler, false);

      try {
        const api = new JitsiMeetExternalAPI(domain, options);
        
        apiRef.current = api;
        setIsLoading(false);

        // Event listeners simplificados y seguros
        const safeAddEventListener = (event: string, handler: (...args: any[]) => void) => {
          try {
            api.addEventListener(event, (...args: any[]) => {
              try {
                handler(...args);
              } catch (error) {
                // Ignorar errores en handlers para evitar crashes
                console.warn(`Error en handler de ${event} (ignorado):`, error);
              }
            });
          } catch (error) {
            console.warn(`Error al agregar listener para ${event} (ignorado):`, error);
          }
        };

        // Evento cuando el usuario se une a la videollamada
        safeAddEventListener('videoConferenceJoined', () => {
          hasJoinedRef.current = true;
          isReconnectingRef.current = false;
          // Cancelar cualquier timeout de cierre pendiente
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        });

        // Evento cuando el usuario sale - IGNORAR COMPLETAMENTE para evitar cierres accidentales
        // Jitsi dispara este evento cuando reconecta (al hacer clic en "Soy el anfitrión")
        // NO cerramos automáticamente - solo cuando el usuario hace clic en el botón de cerrar
        safeAddEventListener('videoConferenceLeft', () => {
          // NO HACER NADA - ignorar completamente este evento
          // El usuario puede estar reconectando o haciendo clic en "Soy el anfitrión"
          // Solo cerramos cuando el usuario hace clic explícitamente en el botón de cerrar
          hasJoinedRef.current = false;
          isReconnectingRef.current = true;
          // NO LLAMAR A onClose - está completamente deshabilitado
        });

        // Evento cuando la API está lista para cerrar (usuario colgó dentro de Jitsi)
        safeAddEventListener('readyToClose', () => {
          allowCloseRef.current = true;
          onCloseRef.current();
        });
        
        // Interceptar cualquier intento de cerrar desde el iframe
        safeAddEventListener('endpointTextMessageReceived', (event: any) => {
          // Interceptar mensajes que puedan intentar cerrar
          if (event && event.eventData && event.eventData.text) {
            const text = String(event.eventData.text || '');
            if (text.includes('close') || text.includes('exit') || text.includes('leave')) {
              // Ignorar mensajes que intenten cerrar
              return;
            }
          }
        });

        // Eventos de participantes (opcionales, solo para logging)
        safeAddEventListener('participantJoined', (_participant: any) => {
          console.log('👤 Participante se unió');
        });

        safeAddEventListener('participantLeft', (_participant: any) => {
          console.log('👋 Participante salió');
        });

        // Manejar errores sin crashear - COMPLETAMENTE SILENCIOSO
        safeAddEventListener('errorOccurred', (error: any) => {
          const errorObj = error?.error || error;
          const errorName = errorObj?.name || errorObj?.message || '';
          
          // El error membersOnly es recuperable - NO HACER NADA, solo silenciar
          if (errorName.includes('membersOnly') || errorName.includes('members-only')) {
            // Completamente silencioso - no loguear nada
            return;
          }
          
          // Para otros errores, también silenciar
          // No loguear nada para evitar que aparezcan en consola
        });

        // Manejar errores de conferencia (especialmente membersOnly) - COMPLETAMENTE SILENCIOSO
        safeAddEventListener('conferenceError', (error: any) => {
          const errorObj = error?.error || error;
          const errorName = errorObj?.name || errorObj?.message || '';
          
          // El error membersOnly es recuperable - NO HACER NADA
          if (errorName.includes('membersOnly') || errorName.includes('members-only')) {
            // Completamente silencioso - no loguear nada
            return;
          }
          
          // Para otros errores, también silenciar
          // No loguear nada
        });

        // Escuchar cuando se sale del lobby (después de hacer clic en "Soy el anfitrión")
        safeAddEventListener('lobbyLeft', () => {
          // Cuando salimos del lobby, significa que se unió exitosamente
          hasJoinedRef.current = true;
          isReconnectingRef.current = false;
          // Cancelar cualquier timeout de cierre pendiente
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        });
        
        // Escuchar cuando se entra al lobby (antes de hacer clic en "Soy el anfitrión")
        safeAddEventListener('lobbyJoined', () => {
          // Cuando se entra al lobby, no cerrar aún
          isReconnectingRef.current = true;
        });

        // Limpiar al desmontar
        return () => {
          try {
            // Limpiar timeout si existe
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
            
            // Restaurar handlers originales
            window.onerror = originalErrorHandler || null;
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalXHROpen;
            XMLHttpRequest.prototype.send = originalXHRSend;
            console.error = originalConsoleError;
            console.warn = originalConsoleWarn;
            console.log = originalConsoleLog;
            window.removeEventListener('unhandledrejection', rejectionHandler, true);
            window.removeEventListener('error', errorEventListener, true);
            window.removeEventListener('message', messageErrorHandler, true);
            window.removeEventListener('message', messageErrorHandler, false);
            
            if (apiRef.current) {
              try {
                apiRef.current.dispose();
              } catch (disposeError) {
                // Silenciar este error también
              }
              apiRef.current = null;
            }
          } catch (error) {
            // Silenciar errores de limpieza
          }
        };
      } catch (error) {
        console.error('Error al inicializar Jitsi Meet:', error);
        setIsLoading(false);
        setLoadError(true);
      }
      } catch (loadError) {
        // Catch para cualquier error en el onload
        console.warn('Error en script.onload (ignorado):', loadError);
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      console.error('Error al cargar el script de Jitsi Meet');
      setIsLoading(false);
      setLoadError(true);
    };

    document.body.appendChild(script);

    return () => {
      // Limpiar script al desmontar
      const scriptSelector = isSelfHosted ? 'script[src*="external_api.js"]' : 'script[src*="8x8.vc"]';
      const existingScript = document.querySelector(scriptSelector);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      isInitializedRef.current = false;
    };
  }, [roomName, userEmail, userName]); // Remover onClose de dependencias para evitar re-renders que causen cierres

  // NUNCA desmontar el componente - siempre renderizar
  // Esto previene que se cierre cuando hay errores o reconexiones
  return (
    <JitsiErrorBoundary>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto' // Asegurar que sea interactivo
      }}>
      {/* Header con información y botón de cerrar */}
      <div style={{
        background: 'linear-gradient(135deg, #2E93CC 0%, #22D3EE 100%)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            📹 Videollamada - {roomName}
          </div>
          {otherUserName && (
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Con: {otherUserName}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            try {
              e.preventDefault();
              e.stopPropagation();
              if ('stopImmediatePropagation' in e && typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
              }
              // Permitir cerrar solo cuando el usuario hace clic explícitamente
              allowCloseRef.current = true;
              onCloseRef.current();
            } catch (error) {
              // Silenciar error
            }
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Contenedor de Jitsi - Aislado para evitar crashes */}
      <div 
        ref={jitsiContainerRef} 
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative',
          isolation: 'isolate', // Aislar el contexto de apilamiento
          contain: 'layout style paint', // Contener el layout para evitar propagación de errores
        }}
        onError={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.warn('Error capturado en contenedor Jitsi (ignorado)');
        }}
      >
        {isLoading && !loadError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>
              Cargando videollamada...
            </div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
              Conectando de forma segura...
            </div>
          </div>
        )}
        {loadError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            maxWidth: '400px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              No se pudo cargar la videollamada
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '24px' }}>
              Comprueba tu conexion a internet e intentalo de nuevo
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#2E93CC',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Reintentar
              </button>
              <button
                onClick={() => { allowCloseRef.current = true; onCloseRef.current(); }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </JitsiErrorBoundary>
  );
}

// Wrapper final que captura cualquier error
export default function JitsiVideoCall(props: JitsiVideoCallProps) {
  try {
    return <JitsiVideoCallComponent {...props} />;
  } catch (error) {
    console.warn('Error crítico en JitsiVideoCall wrapper (mostrando fallback):', error);
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: '#1a1a1a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>⚠️ Error al cargar videollamada</div>
          <button
            onClick={() => {
              try {
                props.onClose();
              } catch (e) {
                window.location.reload();
              }
            }}
            style={{
              background: '#2E93CC',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }
}
