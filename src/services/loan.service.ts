// services/loan.service.ts
import axiosInstance from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  LoanStatus,
} from '@/types/api.types';
import {
  Loan,
  CreateLoanRequest,
  ReturnLoanRequest,
  LoanSearchFilters,
  LoanStats,
  CanBorrowResult,
  ReturnLoanResponse,
} from '@/types/loan.types';
import { MongoUtils } from '@/utils/mongo.utils';

const LOAN_ENDPOINTS = {
  LOANS: '/loans',
  LOAN_BY_ID: (id: string) => `/loans/${id}`,
  RETURN_LOAN: '/returns',
  MARK_AS_LOST: (id: string) => `/returns/${id}/mark-lost`,
  OVERDUE_LOANS: '/loans/overdue',
  ACTIVE_LOANS: '/loans/active',
  LOAN_HISTORY: '/loans/history',
  LOAN_STATS: '/loans/statistics',
  LOAN_STATUSES: '/loan-statuses',
  PERSON_LOANS: (personId: string) => `/loans/person/${personId}`,
  RESOURCE_LOANS: (resourceId: string) => `/loans/resource/${resourceId}`,
  CAN_BORROW: (personId: string) => `/loans/can-borrow/${personId}`,
} as const;

class LoanService {
  /**
   * Crear un nuevo préstamo
   */
  async createLoan(loanData: CreateLoanRequest): Promise<Loan> {
    try {
      // Validar IDs
      MongoUtils.validateIdOrThrow(loanData.personId, 'persona');
      MongoUtils.validateIdOrThrow(loanData.resourceId, 'recurso');

      const response = await axiosInstance.post<ApiResponse<Loan>>(
        LOAN_ENDPOINTS.LOANS,
        loanData
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al crear el préstamo');
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los préstamos con filtros
   */
  async getLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    try {
      // Validar IDs si están presentes
      if (filters.personId) {
        MongoUtils.validateIdOrThrow(filters.personId, 'persona');
      }
      if (filters.resourceId) {
        MongoUtils.validateIdOrThrow(filters.resourceId, 'recurso');
      }

      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
        LOAN_ENDPOINTS.LOANS,
        { params: filters }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener los préstamos');
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamo por ID
   */
  async getLoanById(id: string): Promise<Loan> {
    try {
      MongoUtils.validateIdOrThrow(id, 'préstamo');

      const response = await axiosInstance.get<ApiResponse<Loan>>(
        LOAN_ENDPOINTS.LOAN_BY_ID(id)
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener el préstamo');
    } catch (error) {
      console.error('Error fetching loan:', error);
      throw error;
    }
  }

  /**
   * Procesar devolución de préstamo
   */
  async returnLoan(returnData: ReturnLoanRequest): Promise<ReturnLoanResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<ReturnLoanResponse>>(
        LOAN_ENDPOINTS.RETURN_LOAN,
        returnData
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al devolver el préstamo');
    } catch (error) {
      console.error('Error returning loan:', error);
      throw error;
    }
  }

  /**
   * Marcar préstamo como perdido
   */
  async markAsLost(id: string, observations: string): Promise<Loan> {
    try {
      const response = await axiosInstance.put<ApiResponse<Loan>>(
        LOAN_ENDPOINTS.MARK_AS_LOST(id),
        { observations }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al marcar como perdido');
    } catch (error) {
      console.error('Error marking loan as lost:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos vencidos
   */
  async getOverdueLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
        LOAN_ENDPOINTS.OVERDUE_LOANS,
        { params: filters }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener préstamos vencidos');
    } catch (error) {
      console.error('Error fetching overdue loans:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos activos
   */
  async getActiveLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
        LOAN_ENDPOINTS.ACTIVE_LOANS,
        { params: filters }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener préstamos activos');
    } catch (error) {
      console.error('Error fetching active loans:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos de una persona
   */
  async getPersonLoans(personId: string, filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    if (!MongoUtils.isValidObjectId(personId)) {
      throw new Error('ID de persona inválido');
    }

    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
        LOAN_ENDPOINTS.PERSON_LOANS(personId),
        { params: filters }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener los préstamos de la persona');
    } catch (error) {
      console.error('Error fetching person loans:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos de un recurso
   */
  async getResourceLoans(resourceId: string, filters: LoanSearchFilters = {}): Promise<PaginatedResponse<Loan>> {
    if (!MongoUtils.isValidObjectId(resourceId)) {
      throw new Error('ID de recurso inválido');
    }

    try {
      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Loan>>>(
        LOAN_ENDPOINTS.RESOURCE_LOANS(resourceId),
        { params: filters }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener el historial del recurso');
    } catch (error) {
      console.error('Error fetching resource loans:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de préstamos
   */
  async getLoanStats(): Promise<LoanStats> {
    try {
      const response = await axiosInstance.get<ApiResponse<LoanStats>>(
        LOAN_ENDPOINTS.LOAN_STATS
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener estadísticas');
    } catch (error) {
      console.error('Error fetching loan stats:', error);
      throw error;
    }
  }

  /**
   * Obtener estados de préstamos
   */
  async getLoanStatuses(): Promise<LoanStatus[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<LoanStatus[]>>(
        LOAN_ENDPOINTS.LOAN_STATUSES
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener estados de préstamos');
    } catch (error) {
      console.error('Error fetching loan statuses:', error);
      throw error;
    }
  }

  /**
   * Verificar si una persona puede pedir préstamos
   */
  async canPersonBorrow(personId: string): Promise<CanBorrowResult> {
    try {
      const response = await axiosInstance.get<ApiResponse<CanBorrowResult>>(
        LOAN_ENDPOINTS.CAN_BORROW(personId)
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al verificar disponibilidad de préstamo');
    } catch (error) {
      console.error('Error checking if person can borrow:', error);
      throw error;
    }
  }

  async getLoanSummary(period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        `${LOAN_ENDPOINTS.LOANS}/summary`,
        { params: { period } }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener el resumen de préstamos');
    } catch (error) {
      console.error('Error fetching loan summary:', error);
      throw error;
    }
  }

  async renewLoan(loanId: string): Promise<any> {
    if (!MongoUtils.isValidObjectId(loanId)) {
      throw new Error('ID de préstamo inválido');
    }

    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        `${LOAN_ENDPOINTS.LOAN_BY_ID(loanId)}/renew`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al renovar el préstamo');
    } catch (error) {
      console.error('Error renewing loan:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
export const loanService = new LoanService();