// services/loan.service.ts
import axiosInstance from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';
import {
  Loan,
  LoanStatus,
  CreateLoanRequest,
  ReturnLoanRequest,
  LoanSearchFilters,
  LoanStats,
  CanBorrowResult,
  ReturnLoanResponse,
} from '@/types/loan.types';

const LOAN_ENDPOINTS = {
  LOANS: '/loans',
  LOAN_BY_ID: (id: string) => `/loans/${id}`,
  RETURN_LOAN: '/returns',
  MARK_AS_LOST: (id: string) => `/returns/${id}/mark-lost`,
  OVERDUE_LOANS: '/loans/overdue',
  ACTIVE_LOANS: '/loans/active',
  LOAN_HISTORY: '/loans/history',
  LOAN_STATS: '/loans/stats',
  LOAN_STATUSES: '/loan-statuses',
  PERSON_LOANS: (personId: string) => `/loans/person/${personId}`,
  RESOURCE_LOANS: (resourceId: string) => `/loans/resource/${resourceId}`,
  CAN_BORROW: (personId: string) => `/loans/can-borrow/${personId}`,
} as const;

export class LoanService {
  /**
   * Crear un nuevo préstamo
   */
  static async createLoan(loanData: CreateLoanRequest): Promise<Loan> {
    const response = await axiosInstance.post<ApiResponse<Loan>>(
      LOAN_ENDPOINTS.LOANS,
      loanData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al crear préstamo');
  }

  /**
   * Obtener todos los préstamos con filtros
   */
  static async getLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();

    // Agregar parámetros de filtro
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.personId) params.append('personId', filters.personId);
    if (filters.resourceId) params.append('resourceId', filters.resourceId);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.isOverdue !== undefined) params.append('isOverdue', filters.isOverdue.toString());
    if (filters.daysOverdue) params.append('daysOverdue', filters.daysOverdue.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
      `${LOAN_ENDPOINTS.LOANS}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener préstamos');
  }

  /**
   * Obtener préstamo por ID
   */
  static async getLoanById(id: string): Promise<Loan> {
    const response = await axiosInstance.get<ApiResponse<Loan>>(
      LOAN_ENDPOINTS.LOAN_BY_ID(id)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener préstamo');
  }

  /**
   * Procesar devolución de préstamo
   */
  static async returnLoan(returnData: ReturnLoanRequest): Promise<ReturnLoanResponse> {
    const response = await axiosInstance.post<ApiResponse<ReturnLoanResponse>>(
      LOAN_ENDPOINTS.RETURN_LOAN,
      returnData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al procesar devolución');
  }

  /**
   * Marcar préstamo como perdido
   */
  static async markAsLost(id: string, observations: string): Promise<Loan> {
    const response = await axiosInstance.put<ApiResponse<Loan>>(
      LOAN_ENDPOINTS.MARK_AS_LOST(id),
      { observations }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al marcar como perdido');
  }

  /**
   * Obtener préstamos vencidos
   */
  static async getOverdueLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.daysOverdue) params.append('daysOverdue', filters.daysOverdue.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
      `${LOAN_ENDPOINTS.OVERDUE_LOANS}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener préstamos vencidos');
  }

  /**
   * Obtener préstamos activos
   */
  static async getActiveLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.personId) params.append('personId', filters.personId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
      `${LOAN_ENDPOINTS.ACTIVE_LOANS}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener préstamos activos');
  }

  /**
   * Obtener préstamos de una persona
   */
  static async getPersonLoans(personId: string, filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
      `${LOAN_ENDPOINTS.PERSON_LOANS(personId)}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener préstamos de la persona');
  }

  /**
   * Obtener préstamos de un recurso
   */
  static async getResourceLoans(resourceId: string, filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
      `${LOAN_ENDPOINTS.RESOURCE_LOANS(resourceId)}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener préstamos del recurso');
  }

  /**
   * Obtener estadísticas de préstamos
   */
  static async getLoanStats(): Promise<LoanStats> {
    const response = await axiosInstance.get<ApiResponse<LoanStats>>(
      LOAN_ENDPOINTS.LOAN_STATS
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener estadísticas de préstamos');
  }

  /**
   * Obtener estados de préstamos
   */
  static async getLoanStatuses(): Promise<LoanStatus[]> {
    const response = await axiosInstance.get<ApiResponse<LoanStatus[]>>(
      LOAN_ENDPOINTS.LOAN_STATUSES
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener estados de préstamos');
  }

  /**
   * Verificar si una persona puede pedir préstamos
   */
  static async canPersonBorrow(personId: string): Promise<CanBorrowResult> {
    const response = await axiosInstance.get<ApiResponse<CanBorrowResult>>(
      LOAN_ENDPOINTS.CAN_BORROW(personId)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al verificar disponibilidad de préstamo');
  }
}