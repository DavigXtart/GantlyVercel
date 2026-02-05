import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un nombre de sala de Jitsi basado en los emails de dos usuarios
 * El nombre se genera de forma determinística para que ambos usuarios
 * obtengan el mismo nombre de sala
 */
export function generateJitsiRoomName(email1: string, email2: string): string {
  // Normalizar emails (minúsculas, sin espacios)
  const normalized1 = email1.toLowerCase().trim().replace(/[^a-z0-9@.]/g, '');
  const normalized2 = email2.toLowerCase().trim().replace(/[^a-z0-9@.]/g, '');
  
  // Ordenar alfabéticamente para garantizar consistencia
  const [first, second] = [normalized1, normalized2].sort();
  
  // Crear un hash simple combinando ambos emails
  // Reemplazar caracteres especiales con guiones
  const roomName = `${first}-${second}`
    .replace(/@/g, '-at-')
    .replace(/\./g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50); // Limitar longitud
  
  return `gantly-${roomName}`;
}