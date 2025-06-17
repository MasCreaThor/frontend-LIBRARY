// src/hooks/useLoans.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { LoanService } from '@/services/loan.service';
import type {
  LoanWithDetails,
  CreateLoanRequest,
  UpdateLoanRequest,
  ReturnLoanRequest,
  MarkAsLostRequest,
  LoanSearchFilters,
  OverdueFilters,
  LoanStats,
  OverdueStats,
  StockStats,
  PaginatedResponse
} from '@/types/loan.types';
import toast from 'react-hot-toast';

// ===== QUERY KEYS =====
export const LOAN_QUERY_KEYS = {
  loans: ['loans'] as const,
  loansList: (filters: LoanSearchFilters) => ['loans', 'list', filters] as const,
  loan: (id: string) => ['loans', 'detail', id] as const,
  personLoans: (personId: string, filters?: Partial<LoanSearchFilters>) => 
    ['loans', 'person', personId, filters] as const,
  resourceLoans: (resourceId: string, filters?: Partial<LoanSearchFilters>) => 
    ['loans', 'resource', resourceId, filters] as const,
  
  // Préstamos vencidos
  overdue: ['loans', 'overdue'] as const,
  overdueList: (filters: OverdueFilters) => ['loans', 'overdue', 'list', filters] as const,
  overdueStats: ['loans', 'overdue', 'stats'] as const,
  
  // Devoluciones
  returns: ['returns'] as const,
  returnHistory: (filters: Partial<LoanSearchFilters>) => ['returns', 'history', filters] as const,
  pendingReturns: (filters: Partial<LoanSearchFilters>) => ['returns', 'pending', filters] as const,
  
  // Estadísticas
  loanStats: ['loans', 'stats'] as const,
  stockStats: ['loans', 'stats', 'stock'] as const,
} as const;

// ===== HOOK PRINCIPAL PARA PRÉSTAMOS =====

/**
 * Hook para obtener lista de préstamos con filtros
 */
export function useLoans(
  filters: LoanSearchFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LoanWithDetails>>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LOAN_QUERY_KEYS.loansList(filters),
    queryFn: () => LoanService.getLoans(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    ...options,
  });

  // Mutación para crear préstamo
  const createLoanMutation = useMutation({
    mutationFn: (loanData: CreateLoanRequest) => LoanService.createLoan(loanData),
    onSuccess: (newLoan) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loanStats });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.stockStats });
      
      // Si el préstamo es para una persona específica, invalidar sus préstamos
      if (newLoan.person?._id) {
        queryClient.invalidateQueries({ 
          queryKey: LOAN_QUERY_KEYS.personLoans(newLoan.person._id) 
        });
      }
      
      // Si el préstamo es para un recurso específico, invalidar sus préstamos
      if (newLoan.resource?._id) {
        queryClient.invalidateQueries({ 
          queryKey: LOAN_QUERY_KEYS.resourceLoans(newLoan.resource._id) 
        });
      }

      console.log('✅ useLoans: Préstamo creado y cache actualizado');
    },
    onError: (error: any) => {
      console.error('❌ useLoans: Error al crear préstamo:', error);
    },
  });

  // Mutación para actualizar préstamo
  const updateLoanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoanRequest }) => 
      LoanService.updateLoan(id, data),
    onSuccess: (updatedLoan) => {
      // Actualizar caché específico del préstamo
      queryClient.setQueryData(
        LOAN_QUERY_KEYS.loan(updatedLoan._id),
        updatedLoan
      );
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      
      console.log('✅ useLoans: Préstamo actualizado y cache actualizado');
    },
    onError: (error: any) => {
      console.error('❌ useLoans: Error al actualizar préstamo:', error);
    },
  });

  return {
    // Query data
    loans: query.data?.data || [],
    pagination: query.data?.pagination || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    createLoan: createLoanMutation.mutateAsync,
    updateLoan: updateLoanMutation.mutateAsync,
    isCreating: createLoanMutation.isPending,
    isUpdating: updateLoanMutation.isPending,
  };
}

/**
 * Hook para obtener un préstamo específico por ID
 */
export function useLoan(
  id: string,
  options?: Omit<UseQueryOptions<LoanWithDetails>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.loan(id),
    queryFn: () => LoanService.getLoanById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener préstamos de una persona específica
 */
export function usePersonLoans(
  personId: string,
  filters: Partial<LoanSearchFilters> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LoanWithDetails>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.personLoans(personId, filters),
    queryFn: () => LoanService.getPersonLoans(personId, filters),
    enabled: !!personId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener préstamos de un recurso específico
 */
export function useResourceLoans(
  resourceId: string,
  filters: Partial<LoanSearchFilters> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LoanWithDetails>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.resourceLoans(resourceId, filters),
    queryFn: () => LoanService.getResourceLoans(resourceId, filters),
    enabled: !!resourceId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    ...options,
  });
}

// ===== HOOKS PARA DEVOLUCIONES =====

/**
 * Hook para gestión de devoluciones
 */
export function useReturn() {
  const queryClient = useQueryClient();

  // Mutación para devolver préstamo
  const returnLoanMutation = useMutation({
    mutationFn: ({ loanId, returnData }: { loanId: string; returnData: ReturnLoanRequest }) =>
      LoanService.returnLoan(loanId, returnData),
    onSuccess: (returnResponse) => {
      // Invalidar todas las queries relacionadas con préstamos
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.returns });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loanStats });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.stockStats });
      
      // Actualizar el préstamo específico en el cache
      if (returnResponse.loan) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.loan(returnResponse.loan._id),
          returnResponse.loan
        );
      }

      console.log('✅ useReturn: Préstamo devuelto y cache actualizado');
    },
    onError: (error: any) => {
      console.error('❌ useReturn: Error al devolver préstamo:', error);
    },
  });

  // Mutación para marcar como perdido
  const markAsLostMutation = useMutation({
    mutationFn: ({ loanId, lostData }: { loanId: string; lostData: MarkAsLostRequest }) =>
      LoanService.markAsLost(loanId, lostData),
    onSuccess: (updatedLoan) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loanStats });
      
      // Actualizar el préstamo específico
      queryClient.setQueryData(
        LOAN_QUERY_KEYS.loan(updatedLoan._id),
        updatedLoan
      );

      console.log('✅ useReturn: Préstamo marcado como perdido y cache actualizado');
    },
    onError: (error: any) => {
      console.error('❌ useReturn: Error al marcar como perdido:', error);
    },
  });

  // Mutación para renovar préstamo
  const renewLoanMutation = useMutation({
    mutationFn: (loanId: string) => LoanService.renewLoan(loanId),
    onSuccess: (renewResponse) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      
      // Actualizar el préstamo específico
      if (renewResponse.loan) {
        queryClient.setQueryData(
          LOAN_QUERY_KEYS.loan(renewResponse.loan._id),
          renewResponse.loan
        );
      }

      console.log('✅ useReturn: Préstamo renovado y cache actualizado');
    },
    onError: (error: any) => {
      console.error('❌ useReturn: Error al renovar préstamo:', error);
    },
  });

  return {
    returnLoan: returnLoanMutation.mutateAsync,
    markAsLost: markAsLostMutation.mutateAsync,
    renewLoan: renewLoanMutation.mutateAsync,
    
    isReturning: returnLoanMutation.isPending,
    isMarkingAsLost: markAsLostMutation.isPending,
    isRenewing: renewLoanMutation.isPending,
    
    returnError: returnLoanMutation.error,
    markAsLostError: markAsLostMutation.error,
    renewError: renewLoanMutation.error,
  };
}

/**
 * Hook para obtener historial de devoluciones
 */
export function useReturnHistory(
  filters: Partial<LoanSearchFilters> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LoanWithDetails>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.returnHistory(filters),
    queryFn: () => LoanService.getReturnHistory(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener préstamos pendientes de devolución
 */
export function usePendingReturns(
  filters: Partial<LoanSearchFilters> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LoanWithDetails>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.pendingReturns(filters),
    queryFn: () => LoanService.getPendingReturns(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    ...options,
  });
}

// ===== HOOKS PARA PRÉSTAMOS VENCIDOS =====

/**
 * Hook para obtener préstamos vencidos
 */
export function useOverdueLoans(
  filters: OverdueFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<LoanWithDetails>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.overdueList(filters),
    queryFn: () => LoanService.getOverdueLoans(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto (datos más críticos)
    gcTime: 3 * 60 * 1000, // 3 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener estadísticas de préstamos vencidos
 */
export function useOverdueStats(
  options?: Omit<UseQueryOptions<OverdueStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.overdueStats,
    queryFn: () => LoanService.getOverdueStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    ...options,
  });
}

// ===== HOOKS PARA ESTADÍSTICAS =====

/**
 * Hook para obtener estadísticas generales de préstamos
 */
export function useLoanStats(
  options?: Omit<UseQueryOptions<LoanStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.loanStats,
    queryFn: () => LoanService.getLoanStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener estadísticas de stock
 */
export function useStockStats(
  options?: Omit<UseQueryOptions<StockStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.stockStats,
    queryFn: () => LoanService.getStockStats(),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    ...options,
  });
}

// ===== HOOKS DE UTILIDAD =====

/**
 * Hook para invalidar todas las queries relacionadas con préstamos
 */
export function useInvalidateLoans() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.returns });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.overdue });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loanStats });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.stockStats });
      console.log('🔄 useInvalidateLoans: Todas las queries de préstamos invalidadas');
    },
    
    invalidateLoans: () => {
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loans });
      console.log('🔄 useInvalidateLoans: Queries de préstamos invalidadas');
    },
    
    invalidateStats: () => {
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.loanStats });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.stockStats });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.overdueStats });
      console.log('🔄 useInvalidateLoans: Queries de estadísticas invalidadas');
    },
  };
}