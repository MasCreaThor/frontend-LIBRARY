// hooks/useLoan.ts
// ================================================================
// HOOKS PERSONALIZADOS PARA SISTEMA DE PRÉSTAMOS
// ================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoanService } from '@/services/loan.service';
import type {
  LoanWithDetails,
  CreateLoanRequest,
  UpdateLoanRequest,
  ReturnLoanRequest,
  MarkAsLostRequest,
  LoanSearchFilters,
  OverdueFilters,
  CanBorrowResult,
  ResourceAvailabilityResult,
  LoanValidationResult,
  ReturnLoanResponse,
  LoanStats,
  OverdueStats,
  StockStats,
  UseLoanState,
  UseLoansState,
  UseReturnState,
  UseOverdueState
} from '@/types/loan.types';

// ===== HOOK PARA PRÉSTAMO INDIVIDUAL =====

export const useLoan = (loanId?: string) => {
  const [state, setState] = useState<UseLoanState>({
    loan: null,
    loading: false,
    error: null
  });

  const fetchLoan = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const loan = await LoanService.getLoanById(id);
      setState(prev => ({ ...prev, loan, loading: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cargar el préstamo' 
      }));
    }
  }, []);

  const updateLoan = useCallback(async (id: string, data: UpdateLoanRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const loan = await LoanService.updateLoan(id, data);
      setState(prev => ({ ...prev, loan, loading: false }));
      return loan;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al actualizar el préstamo' 
      }));
      throw error;
    }
  }, []);

  const renewLoan = useCallback(async (id: string, newDueDate?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await LoanService.renewLoan(id, newDueDate);
      setState(prev => ({ ...prev, loan: result.loan, loading: false }));
      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al renovar el préstamo' 
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    if (loanId) {
      fetchLoan(loanId);
    }
  }, [loanId, fetchLoan]);

  return {
    ...state,
    refetch: () => loanId && fetchLoan(loanId),
    updateLoan,
    renewLoan
  };
};

// ===== HOOK PARA LISTA DE PRÉSTAMOS =====

export const useLoans = (initialFilters: LoanSearchFilters = {}) => {
  const [state, setState] = useState<UseLoansState>({
    loans: [],
    loading: false,
    error: null,
    pagination: null
  });

  const [filters, setFilters] = useState<LoanSearchFilters>(initialFilters);

  const fetchLoans = useCallback(async (searchFilters?: LoanSearchFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const finalFilters = searchFilters || filters;
      const result = await LoanService.searchLoans(finalFilters);
      
      setState(prev => ({ 
        ...prev, 
        loans: result.data, 
        pagination: result.pagination,
        loading: false 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cargar los préstamos' 
      }));
    }
  }, [filters]);

  const createLoan = useCallback(async (data: CreateLoanRequest) => {
    try {
      const newLoan = await LoanService.createLoan(data);
      
      // Actualizar la lista
      setState(prev => ({
        ...prev,
        loans: [newLoan, ...prev.loans]
      }));
      
      return newLoan;
    } catch (error: any) {
      throw error;
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<LoanSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchLoans(updatedFilters);
  }, [filters, fetchLoans]);

  const changePage = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchLoans(newFilters);
  }, [filters, fetchLoans]);

  const changeLimit = useCallback((limit: number) => {
    const newFilters = { ...filters, limit, page: 1 };
    setFilters(newFilters);
    fetchLoans(newFilters);
  }, [filters, fetchLoans]);

  useEffect(() => {
    fetchLoans();
  }, []);

  return {
    ...state,
    filters,
    createLoan,
    refetch: () => fetchLoans(),
    updateFilters,
    changePage,
    changeLimit,
    clearFilters: () => {
      const defaultFilters = { page: 1, limit: 20 };
      setFilters(defaultFilters);
      fetchLoans(defaultFilters);
    }
  };
};

// ===== HOOK PARA DEVOLUCIONES =====

export const useReturn = () => {
  const [state, setState] = useState<UseReturnState>({
    processing: false,
    error: null,
    lastReturn: null
  });

  const processReturn = useCallback(async (data: ReturnLoanRequest) => {
    setState(prev => ({ ...prev, processing: true, error: null }));
    
    try {
      const result = await LoanService.returnLoan(data);
      setState(prev => ({ 
        ...prev, 
        processing: false, 
        lastReturn: result 
      }));
      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        processing: false, 
        error: error.message || 'Error al procesar la devolución' 
      }));
      throw error;
    }
  }, []);

  const markAsLost = useCallback(async (loanId: string, data: MarkAsLostRequest) => {
    setState(prev => ({ ...prev, processing: true, error: null }));
    
    try {
      const result = await LoanService.markAsLost(loanId, data);
      setState(prev => ({ ...prev, processing: false }));
      return result;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        processing: false, 
        error: error.message || 'Error al marcar como perdido' 
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    processReturn,
    markAsLost,
    clearError
  };
};

// ===== HOOK PARA PRÉSTAMOS VENCIDOS =====

export const useOverdue = (initialFilters: OverdueFilters = {}) => {
  const [state, setState] = useState<UseOverdueState>({
    overdueLoans: [],
    stats: null,
    loading: false,
    error: null,
    pagination: null
  });

  const [filters, setFilters] = useState<OverdueFilters>(initialFilters);

  const fetchOverdueLoans = useCallback(async (searchFilters?: OverdueFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const finalFilters = searchFilters || filters;
      const result = await LoanService.getOverdueLoans(finalFilters);
      
      setState(prev => ({ 
        ...prev, 
        overdueLoans: result.data, 
        pagination: result.pagination,
        loading: false 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cargar préstamos vencidos' 
      }));
    }
  }, [filters]);

  const fetchOverdueStats = useCallback(async () => {
    try {
      const stats = await LoanService.getOverdueStats();
      setState(prev => ({ ...prev, stats }));
    } catch (error: any) {
      console.error('Error al cargar estadísticas de vencidos:', error);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<OverdueFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchOverdueLoans(updatedFilters);
  }, [filters, fetchOverdueLoans]);

  useEffect(() => {
    fetchOverdueLoans();
    fetchOverdueStats();
  }, []);

  return {
    ...state,
    filters,
    refetch: () => fetchOverdueLoans(),
    updateFilters,
    refetchStats: fetchOverdueStats
  };
};

// ===== HOOK PARA VALIDACIONES =====

export const useValidation = () => {
  const [loading, setLoading] = useState(false);

  const canPersonBorrow = useCallback(async (personId: string): Promise<CanBorrowResult> => {
    setLoading(true);
    try {
      const result = await LoanService.canPersonBorrow(personId);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkResourceAvailability = useCallback(async (resourceId: string): Promise<ResourceAvailabilityResult> => {
    setLoading(true);
    try {
      const result = await LoanService.checkResourceAvailability(resourceId);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateLoan = useCallback(async (data: CreateLoanRequest): Promise<LoanValidationResult> => {
    setLoading(true);
    try {
      const result = await LoanService.validateLoan(data);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    canPersonBorrow,
    checkResourceAvailability,
    validateLoan
  };
};

// ===== HOOK PARA ESTADÍSTICAS =====

export const useStatistics = () => {
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
  const [stockStats, setStockStats] = useState<StockStats | null>(null);
  const [overdueStats, setOverdueStats] = useState<OverdueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoanStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await LoanService.getLoanStatistics();
      setLoanStats(stats);
    } catch (error: any) {
      setError(error.message || 'Error al cargar estadísticas de préstamos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await LoanService.getStockStatistics();
      setStockStats(stats);
    } catch (error: any) {
      setError(error.message || 'Error al cargar estadísticas de stock');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverdueStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await LoanService.getOverdueStats();
      setOverdueStats(stats);
    } catch (error: any) {
      setError(error.message || 'Error al cargar estadísticas de vencidos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [loans, stock, overdue] = await Promise.all([
        LoanService.getLoanStatistics(),
        LoanService.getStockStatistics(),
        LoanService.getOverdueStats()
      ]);
      
      setLoanStats(loans);
      setStockStats(stock);
      setOverdueStats(overdue);
    } catch (error: any) {
      setError(error.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loanStats,
    stockStats,
    overdueStats,
    loading,
    error,
    fetchLoanStats,
    fetchStockStats,
    fetchOverdueStats,
    fetchAllStats
  };
};

// ===== HOOK PARA RESUMEN RÁPIDO =====

export const useDashboard = () => {
  const [summary, setSummary] = useState<{
    totalActive: number;
    totalOverdue: number;
    totalDueSoon: number;
    totalReturnsToday: number;
  } | null>(null);
  
  const [dueSoonLoans, setDueSoonLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [summaryData, dueSoon] = await Promise.all([
        LoanService.getLoanSummary(),
        LoanService.getLoansDueSoon(3)
      ]);
      
      setSummary(summaryData);
      setDueSoonLoans(dueSoon);
    } catch (error: any) {
      setError(error.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    summary,
    dueSoonLoans,
    loading,
    error,
    refetch: fetchDashboardData
  };
};

// ===== HOOK PARA BÚSQUEDA EN TIEMPO REAL =====

export const useSearchLoans = (debounceMs: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (term: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!term.trim()) {
          setSearchResults([]);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
          const result = await LoanService.searchLoans({
            search: term,
            limit: 10
          });
          setSearchResults(result.data);
        } catch (error: any) {
          setError(error.message || 'Error en la búsqueda');
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    };
  }, [debounceMs]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchTerm,
    searchResults,
    loading,
    error,
    handleSearch,
    clearSearch
  };
};

// ===== HOOK PARA GESTIÓN DE FORMULARIOS =====

export const useLoanForm = () => {
  const [formData, setFormData] = useState<Partial<CreateLoanRequest>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((field: string, value: any): string | undefined => {
    switch (field) {
      case 'personId':
        return !value ? 'La persona es obligatoria' : undefined;
      case 'resourceId':
        return !value ? 'El recurso es obligatorio' : undefined;
      case 'quantity':
        if (!value || value < 1) return 'La cantidad debe ser mayor a 0';
        if (value > 50) return 'La cantidad no puede ser mayor a 50';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  }, [validateField]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof CreateLoanRequest]);
      if (error) newErrors[field] = error;
    });
    
    setErrors(newErrors);
    const isFormValid = Object.keys(newErrors).length === 0 && 
      formData.personId && formData.resourceId;
    setIsValid(isFormValid);
    
    return isFormValid;
  }, [formData, validateField]);

  const resetForm = useCallback(() => {
    setFormData({});
    setErrors({});
    setIsValid(false);
  }, []);

  return {
    formData,
    errors,
    isValid,
    updateField,
    validateForm,
    resetForm
  };
};

export default {
  useLoan,
  useLoans,
  useReturn,
  useOverdue,
  useValidation,
  useStatistics,
  useDashboard,
  useSearchLoans,
  useLoanForm
};