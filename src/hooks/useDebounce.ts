// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook para aplicar debouncing a un valor
 * Útil para optimizar búsquedas y evitar llamadas excesivas a la API
 * 
 * @param value - El valor a debounce
 * @param delay - El tiempo de retraso en milisegundos
 * @returns El valor debouncado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecer el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia antes de que se ejecute
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}