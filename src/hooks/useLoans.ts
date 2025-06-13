// hooks/useLoans.ts
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { LoanService } from '@/services/loan.service';
import {
  Loan,
  LoanSearchFilters,
  CreateLoanRequest,
  ReturnLoanRequest,
  LoanStats,
  CanBorrowResult,
  ReturnLoanResponse,
} from '@/types/loan.types';
import { PaginatedResponse } from '@/types/api.types';

export function useLoans(initialFilters: LoanSearchFilters = {}) {
  const [loans, setLoans] = useState<PaginatedResponse<Loan>>({
    data: [],
    pagination: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LoanSearchFilters>(initialFilters);
  const toast = useToast();

  const fetchLoans = useCallback(async (searchFilters?: LoanSearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = searchFilters || filters;
      const response = await LoanService.getLoans(filtersToUse);
      setLoans(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar préstamos';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const updateFilters = useCallback((newFilters: Partial<LoanSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchLoans(updatedFilters);
  }, [filters, fetchLoans]);

  const changePage = useCallback((page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchLoans(updatedFilters);
  }, [filters, fetchLoans]);

  const refresh = useCallback(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return {
    loans,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    refresh,
  };
}

// Hook para crear préstamos
export function useCreateLoan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const createLoan = useCallback(async (loanData: CreateLoanRequest): Promise<Loan | null> => {
    setLoading(true);
    setError(null);

    try {
      const newLoan = await LoanService.createLoan(loanData);
      toast({
        title: 'Préstamo creado',
        description: 'El préstamo se ha registrado exitosamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      return newLoan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear préstamo';
      setError(errorMessage);
      toast({
        title: 'Error al crear préstamo',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    createLoan,
    loading,
    error,
  };
}

// Hook para devolver préstamos
export function useReturnLoan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const returnLoan = useCallback(async (returnData: ReturnLoanRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await LoanService.returnLoan(returnData);
      toast({
        title: 'Devolución procesada',
        description: result.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar devolución';
      setError(errorMessage);
      toast({
        title: 'Error en devolución',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const markAsLost = useCallback(async (loanId: string, observations: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await LoanService.markAsLost(loanId, observations);
      toast({
        title: 'Préstamo marcado como perdido',
        description: 'El recurso ha sido marcado como perdido',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al marcar como perdido';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    returnLoan,
    markAsLost,
    loading,
    error,
  };
}

// Hook para estadísticas de préstamos
export function useLoanStats() {
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await LoanService.getLoanStats();
      setStats(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

// Hook para verificar si una persona puede pedir préstamos
export function useCanBorrow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCanBorrow = useCallback(async (personId: string): Promise<CanBorrowResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await LoanService.canPersonBorrow(personId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar disponibilidad';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkCanBorrow,
    loading,
    error,
  };
}