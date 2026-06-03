import { toast } from '../components/ui/Toast';

/**
 * Centralized error handler — displays user-friendly Spanish messages
 * based on HTTP status codes and error types. Never exposes raw backend
 * messages, stack traces, or technical jargon to the user.
 */
export function handleError(
  error: unknown,
  fallbackMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.'
): void {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string; error?: string } };
    };
    const status = axiosError.response?.status;

    if (status === 429) {
      toast.error('Has realizado demasiadas solicitudes. Espera un momento e inténtalo de nuevo.');
      return;
    }
    if (status === 401) {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      return;
    }
    if (status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
      return;
    }
    if (status === 404) {
      toast.error('No se encontró el recurso solicitado.');
      return;
    }
    if (status === 413) {
      toast.error('El archivo es demasiado grande. El tamaño máximo permitido es 5 MB.');
      return;
    }
    if (status && status >= 500) {
      toast.error('Error en el servidor. Por favor, inténtalo más tarde.');
      return;
    }
  }

  // Network error
  if (error instanceof Error && error.message === 'Network Error') {
    toast.error('Error de conexión. Comprueba tu conexión a internet.');
    return;
  }

  toast.error(fallbackMessage);
}

export function showSuccess(message: string): void {
  toast.success(message);
}

export function showInfo(message: string): void {
  toast.info(message);
}
