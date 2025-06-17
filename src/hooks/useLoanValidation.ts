// src/hooks/useLoanValidation.ts
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoanService } from '@/services/loan.service';
import type { 
  CanBorrowResult, 
  ResourceAvailabilityResult, 
  LoanValidationResult 
} from '@/types/loan.types';

interface UseLoanValidationReturn {
  // Estados de validación
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  loading: boolean;
  
  // Funciones de validación individual
  canPersonBorrow: (personId: string) => Promise<CanBorrowResult>;
  checkResourceAvailability: (resourceId: string, quantity?: number) => Promise<ResourceAvailabilityResult>;
  validateLoan: (personId: string, resourceId: string, quantity: number) => Promise<void>;
  
  // Estado de la última validación
  lastValidation: LoanValidationResult | null;
  
  // Limpiar validaciones
  clearValidation: () => void;
}

export function useLoanValidation(): UseLoanValidationReturn {
  // Estados locales
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastValidation, setLastValidation] = useState<LoanValidationResult | null>(null);

  /**
   * Validar si una persona puede pedir prestado
   */
  const canPersonBorrow = useCallback(async (personId: string): Promise<CanBorrowResult> => {
    try {
      const result = await LoanService.canPersonBorrow(personId);
      return result;
    } catch (error: any) {
      console.error('Error checking if person can borrow:', error);
      throw new Error(error?.response?.data?.message || 'Error al validar persona');
    }
  }, []);

  /**
   * Verificar disponibilidad de un recurso
   */
  const checkResourceAvailability = useCallback(async (
    resourceId: string, 
    quantity: number = 1
  ): Promise<ResourceAvailabilityResult> => {
    try {
      const result = await LoanService.checkResourceAvailability(resourceId, quantity);
      return result;
    } catch (error: any) {
      console.error('Error checking resource availability:', error);
      throw new Error(error?.response?.data?.message || 'Error al validar recurso');
    }
  }, []);

  /**
   * Validar un préstamo completo (persona + recurso + cantidad)
   */
  const validateLoan = useCallback(async (
    personId: string, 
    resourceId: string, 
    quantity: number
  ): Promise<void> => {
    setLoading(true);
    setValidationErrors([]);
    setValidationWarnings([]);
    setIsValid(false);

    try {
      // Validar utilizando el endpoint de validación completa del backend
      const validation = await LoanService.validateLoan({
        personId,
        resourceId,
        quantity
      });

      // Actualizar estado con los resultados
      setLastValidation(validation);
      setValidationErrors(validation.errors || []);
      setValidationWarnings(validation.warnings || []);
      setIsValid(validation.isValid);

    } catch (error: any) {
      console.error('Error validating loan:', error);
      const errorMessage = error?.response?.data?.message || 'Error al validar préstamo';
      setValidationErrors([errorMessage]);
      setIsValid(false);
      setLastValidation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar todas las validaciones
   */
  const clearValidation = useCallback(() => {
    setIsValid(false);
    setValidationErrors([]);
    setValidationWarnings([]);
    setLastValidation(null);
    setLoading(false);
  }, []);

  return {
    // Estados
    isValid,
    validationErrors,
    validationWarnings,
    loading,
    lastValidation,
    
    // Funciones
    canPersonBorrow,
    checkResourceAvailability,
    validateLoan,
    clearValidation,
  };
}

/**
 * Hook para validación en tiempo real de formularios de préstamo
 */
export function useRealtimeLoanValidation(
  personId?: string,
  resourceId?: string,
  quantity?: number,
  enabled: boolean = false
) {
  const [validationResult, setValidationResult] = useState<LoanValidationResult | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['loan-validation', personId, resourceId, quantity],
    queryFn: async () => {
      if (!personId || !resourceId || !quantity) {
        return null;
      }
      
      return await LoanService.validateLoan({
        personId,
        resourceId,
        quantity
      });
    },
    enabled: enabled && !!personId && !!resourceId && !!quantity && quantity > 0,
    staleTime: 30 * 1000, // 30 segundos
    retry: 1,
  });

  // Actualizar el resultado cuando cambien los datos
  useState(() => {
    setValidationResult(data || null);
  }, [data]);

  return {
    validation: validationResult,
    isValidating: isLoading,
    validationError: error,
    isValid: validationResult?.isValid || false,
    errors: validationResult?.errors || [],
    warnings: validationResult?.warnings || [],
  };
}

/**
 * Hook para validar disponibilidad de recursos en tiempo real
 */
export function useResourceAvailability(resourceId?: string, quantity: number = 1) {
  return useQuery({
    queryKey: ['resource-availability', resourceId, quantity],
    queryFn: async () => {
      if (!resourceId) return null;
      return await LoanService.checkResourceAvailability(resourceId, quantity);
    },
    enabled: !!resourceId,
    staleTime: 60 * 1000, // 1 minuto
    retry: 2,
  });
}

/**
 * Hook para validar si una persona puede pedir prestado
 */
export function useCanPersonBorrow(personId?: string) {
  return useQuery({
    queryKey: ['can-person-borrow', personId],
    queryFn: async () => {
      if (!personId) return null;
      return await LoanService.canPersonBorrow(personId);
    },
    enabled: !!personId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
  });
}