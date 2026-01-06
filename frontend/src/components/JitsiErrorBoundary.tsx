import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class JitsiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para que la próxima renderización muestre la UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silenciar completamente errores relacionados con Jitsi/Chrome
    const errorStr = String(error?.message || error?.toString() || '');
    const errorStack = error?.stack || '';
    const componentStack = errorInfo?.componentStack || '';
    
    const shouldIgnore = 
      errorStr.includes('Jitsi') ||
      errorStr.includes('jitsi') ||
      errorStr.includes('chrome-extension') ||
      errorStr.includes('ERR_FAILED') ||
      errorStr.includes('meet.jit.si') ||
      errorStack.includes('Jitsi') ||
      errorStack.includes('jitsi') ||
      componentStack.includes('Jitsi') ||
      componentStack.includes('jitsi');
    
    if (shouldIgnore) {
      // Silenciar completamente - no loguear nada
      // Resetear el estado para que continúe funcionando
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 0);
      return;
    }
    
    // Para otros errores, solo loguear pero no crashear
    console.warn('Error capturado por Error Boundary (ignorado):', error);
    
    // Llamar al callback si existe
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (e) {
        // Ignorar errores en el callback
      }
    }
    
    // Resetear el estado después de un tiempo para que continúe funcionando
    setTimeout(() => {
      this.setState({ hasError: false, error: null });
    }, 100);
  }

  render() {
    // SIEMPRE renderizar children - NUNCA desmontar el componente
    // Incluso si hay un error, continuar renderizando para que Jitsi funcione
    try {
      return this.props.children;
    } catch (error) {
      // Si hay un error en el render, intentar renderizar de nuevo
      // Esto previene que el componente se desmonte completamente
      return this.props.children;
    }
  }
}

