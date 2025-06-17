// src/services/loan.service.ts
import axiosInstance from '@/lib/axios';
import type {
  Loan,
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
  RenewLoanResponse,
  LoanStats,
  OverdueStats,
  StockStats,
  ApiResponse,
  PaginatedResponse
} from '@/types/loan.types';

// ===== ENDPOINTS =====
const LOAN_ENDPOINTS = {
  // Préstamos principales
  LOANS: '/loans',
  LOAN_BY_ID: (id: string) => `/loans/${id}`,
  VALIDATE_LOAN: '/loans/validate',
  PERSON_LOANS: (personId: string) => `/loans/person/${personId}`,
  RESOURCE_LOANS: (resourceId: string) => `/loans/resource/${resourceId}`,
  
  // Validaciones
  CAN_BORROW: (personId: string) => `/loans/can-borrow/${personId}`,
  RESOURCE_AVAILABILITY: (resourceId: string) => `/loans/resource-availability/${resourceId}`,
  
  // Devoluciones
  RETURNS: '/returns',
  RETURN_LOAN: (loanId: string) => `/returns/${loanId}`,
  MARK_AS_LOST: (loanId: string) => `/returns/${loanId}/mark-lost`,
  RENEW_LOAN: (loanId: string) => `/returns/${loanId}/renew`,
  RETURN_HISTORY: '/returns/history',
  PENDING_RETURNS: '/returns/pending',
  
  // Préstamos vencidos
  OVERDUE: '/overdue',
  OVERDUE_STATS: '/overdue/stats',
  
  // Estadísticas
  LOAN_STATS: '/loans/stats',
  STOCK_STATS: '/loans/stats/stock',
} as const;

export class LoanService {
  // ===== OPERACIONES PRINCIPALES =====

  /**
   * Crear un nuevo préstamo
   */
  static async createLoan(loanData: CreateLoanRequest): Promise<LoanWithDetails> {
    try {
      console.log('📝 LoanService: Creando préstamo:', loanData);
      
      const response = await axiosInstance.post<ApiResponse<LoanWithDetails>>(
        LOAN_ENDPOINTS.LOANS,
        loanData
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Préstamo creado exitosamente:', response.data.data._id);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al crear préstamo');
    } catch (error: any) {
      console.error('❌ LoanService: Error al crear préstamo:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los préstamos con filtros
   */
  static async getLoans(filters: LoanSearchFilters = {}): Promise<PaginatedResponse<LoanWithDetails>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔍 LoanService: Obteniendo préstamos con filtros:', filters);
      
      const response = await axiosInstance.get<PaginatedResponse<LoanWithDetails>>(
        `${LOAN_ENDPOINTS.LOANS}?${params.toString()}`
      );

      console.log(`✅ LoanService: ${response.data.data.length} préstamos obtenidos`);
      return response.data;
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener préstamos:', error);
      throw error;
    }
  }

  /**
   * Obtener un préstamo por ID
   */
  static async getLoanById(id: string): Promise<LoanWithDetails> {
    try {
      console.log('🔍 LoanService: Obteniendo préstamo por ID:', id);
      
      const response = await axiosInstance.get<ApiResponse<LoanWithDetails>>(
        LOAN_ENDPOINTS.LOAN_BY_ID(id)
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Préstamo obtenido exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Préstamo no encontrado');
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener préstamo:', error);
      throw error;
    }
  }

  /**
   * Actualizar un préstamo
   */
  static async updateLoan(id: string, updateData: UpdateLoanRequest): Promise<LoanWithDetails> {
    try {
      console.log('📝 LoanService: Actualizando préstamo:', id);
      
      const response = await axiosInstance.patch<ApiResponse<LoanWithDetails>>(
        LOAN_ENDPOINTS.LOAN_BY_ID(id),
        updateData
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Préstamo actualizado exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al actualizar préstamo');
    } catch (error: any) {
      console.error('❌ LoanService: Error al actualizar préstamo:', error);
      throw error;
    }
  }

  // ===== VALIDACIONES =====

  /**
   * Validar si una persona puede pedir prestado
   */
  static async canPersonBorrow(personId: string, includeDetails: boolean = true): Promise<CanBorrowResult> {
    try {
      console.log('🔍 LoanService: Validando si persona puede pedir prestado:', personId);
      
      const params = new URLSearchParams();
      if (includeDetails) {
        params.append('includeDetails', 'true');
      }

      const response = await axiosInstance.get<ApiResponse<CanBorrowResult>>(
        `${LOAN_ENDPOINTS.CAN_BORROW(personId)}?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        console.log(`✅ LoanService: Validación completada - Can borrow: ${response.data.data.canBorrow}`);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al validar persona');
    } catch (error: any) {
      console.error('❌ LoanService: Error al validar persona:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de un recurso
   */
  static async checkResourceAvailability(
    resourceId: string, 
    requestedQuantity: number = 1
  ): Promise<ResourceAvailabilityResult> {
    try {
      console.log('🔍 LoanService: Verificando disponibilidad del recurso:', resourceId, 'cantidad:', requestedQuantity);
      
      const params = new URLSearchParams();
      if (requestedQuantity > 1) {
        params.append('requestedQuantity', requestedQuantity.toString());
      }

      const response = await axiosInstance.get<ApiResponse<ResourceAvailabilityResult>>(
        `${LOAN_ENDPOINTS.RESOURCE_AVAILABILITY(resourceId)}?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        console.log(`✅ LoanService: Disponibilidad verificada - Disponible: ${response.data.data.canLoan}`);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al verificar disponibilidad');
    } catch (error: any) {
      console.error('❌ LoanService: Error al verificar disponibilidad:', error);
      throw error;
    }
  }

  /**
   * Validar préstamo completo (persona + recurso + cantidad)
   */
  static async validateLoan(validationData: {
    personId: string;
    resourceId: string;
    quantity: number;
  }): Promise<LoanValidationResult> {
    try {
      console.log('🔍 LoanService: Validando préstamo completo:', validationData);
      
      const response = await axiosInstance.post<ApiResponse<LoanValidationResult>>(
        LOAN_ENDPOINTS.VALIDATE_LOAN,
        validationData
      );

      if (response.data.success && response.data.data) {
        console.log(`✅ LoanService: Validación completada - Válido: ${response.data.data.isValid}`);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al validar préstamo');
    } catch (error: any) {
      console.error('❌ LoanService: Error al validar préstamo:', error);
      throw error;
    }
  }

  // ===== DEVOLUCIONES =====

  /**
   * Devolver un préstamo
   */
  static async returnLoan(loanId: string, returnData: ReturnLoanRequest): Promise<ReturnLoanResponse> {
    try {
      console.log('📝 LoanService: Devolviendo préstamo:', loanId);
      
      const response = await axiosInstance.post<ApiResponse<ReturnLoanResponse>>(
        LOAN_ENDPOINTS.RETURN_LOAN(loanId),
        returnData
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Préstamo devuelto exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al devolver préstamo');
    } catch (error: any) {
      console.error('❌ LoanService: Error al devolver préstamo:', error);
      throw error;
    }
  }

  /**
   * Marcar préstamo como perdido
   */
  static async markAsLost(loanId: string, lostData: MarkAsLostRequest): Promise<LoanWithDetails> {
    try {
      console.log('📝 LoanService: Marcando préstamo como perdido:', loanId);
      
      const response = await axiosInstance.post<ApiResponse<LoanWithDetails>>(
        LOAN_ENDPOINTS.MARK_AS_LOST(loanId),
        lostData
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Préstamo marcado como perdido exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al marcar como perdido');
    } catch (error: any) {
      console.error('❌ LoanService: Error al marcar como perdido:', error);
      throw error;
    }
  }

  /**
   * Renovar un préstamo
   */
  static async renewLoan(loanId: string): Promise<RenewLoanResponse> {
    try {
      console.log('📝 LoanService: Renovando préstamo:', loanId);
      
      const response = await axiosInstance.post<ApiResponse<RenewLoanResponse>>(
        LOAN_ENDPOINTS.RENEW_LOAN(loanId)
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Préstamo renovado exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al renovar préstamo');
    } catch (error: any) {
      console.error('❌ LoanService: Error al renovar préstamo:', error);
      throw error;
    }
  }

  // ===== PRÉSTAMOS VENCIDOS =====

  /**
   * Obtener préstamos vencidos
   */
  static async getOverdueLoans(filters: OverdueFilters = {}): Promise<PaginatedResponse<LoanWithDetails>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔍 LoanService: Obteniendo préstamos vencidos:', filters);
      
      const response = await axiosInstance.get<PaginatedResponse<LoanWithDetails>>(
        `${LOAN_ENDPOINTS.OVERDUE}?${params.toString()}`
      );

      console.log(`✅ LoanService: ${response.data.data.length} préstamos vencidos obtenidos`);
      return response.data;
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener préstamos vencidos:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de préstamos vencidos
   */
  static async getOverdueStats(): Promise<OverdueStats> {
    try {
      console.log('🔍 LoanService: Obteniendo estadísticas de vencidos');
      
      const response = await axiosInstance.get<ApiResponse<OverdueStats>>(
        LOAN_ENDPOINTS.OVERDUE_STATS
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Estadísticas de vencidos obtenidas');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener estadísticas');
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener estadísticas de vencidos:', error);
      throw error;
    }
  }

  // ===== CONSULTAS ESPECÍFICAS =====

  /**
   * Obtener préstamos de una persona
   */
  static async getPersonLoans(
    personId: string, 
    filters: Partial<LoanSearchFilters> = {}
  ): Promise<PaginatedResponse<LoanWithDetails>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔍 LoanService: Obteniendo préstamos de persona:', personId);
      
      const response = await axiosInstance.get<PaginatedResponse<LoanWithDetails>>(
        `${LOAN_ENDPOINTS.PERSON_LOANS(personId)}?${params.toString()}`
      );

      console.log(`✅ LoanService: ${response.data.data.length} préstamos de persona obtenidos`);
      return response.data;
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener préstamos de persona:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos de un recurso
   */
  static async getResourceLoans(
    resourceId: string, 
    filters: Partial<LoanSearchFilters> = {}
  ): Promise<PaginatedResponse<LoanWithDetails>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔍 LoanService: Obteniendo préstamos de recurso:', resourceId);
      
      const response = await axiosInstance.get<PaginatedResponse<LoanWithDetails>>(
        `${LOAN_ENDPOINTS.RESOURCE_LOANS(resourceId)}?${params.toString()}`
      );

      console.log(`✅ LoanService: ${response.data.data.length} préstamos de recurso obtenidos`);
      return response.data;
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener préstamos de recurso:', error);
      throw error;
    }
  }

  // ===== ESTADÍSTICAS =====

  /**
   * Obtener estadísticas generales de préstamos
   */
  static async getLoanStats(): Promise<LoanStats> {
    try {
      console.log('🔍 LoanService: Obteniendo estadísticas de préstamos');
      
      const response = await axiosInstance.get<ApiResponse<LoanStats>>(
        LOAN_ENDPOINTS.LOAN_STATS
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Estadísticas de préstamos obtenidas');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener estadísticas');
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener estadísticas de préstamos:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de stock
   */
  static async getStockStats(): Promise<StockStats> {
    try {
      console.log('🔍 LoanService: Obteniendo estadísticas de stock');
      
      const response = await axiosInstance.get<ApiResponse<StockStats>>(
        LOAN_ENDPOINTS.STOCK_STATS
      );

      if (response.data.success && response.data.data) {
        console.log('✅ LoanService: Estadísticas de stock obtenidas');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener estadísticas de stock');
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener estadísticas de stock:', error);
      throw error;
    }
  }

  // ===== HISTORIAL Y DEVOLUCIONES =====

  /**
   * Obtener historial de devoluciones
   */
  static async getReturnHistory(filters: Partial<LoanSearchFilters> = {}): Promise<PaginatedResponse<LoanWithDetails>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔍 LoanService: Obteniendo historial de devoluciones');
      
      const response = await axiosInstance.get<PaginatedResponse<LoanWithDetails>>(
        `${LOAN_ENDPOINTS.RETURN_HISTORY}?${params.toString()}`
      );

      console.log(`✅ LoanService: ${response.data.data.length} devoluciones en historial`);
      return response.data;
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener historial de devoluciones:', error);
      throw error;
    }
  }

  /**
   * Obtener préstamos pendientes de devolución
   */
  static async getPendingReturns(filters: Partial<LoanSearchFilters> = {}): Promise<PaginatedResponse<LoanWithDetails>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔍 LoanService: Obteniendo préstamos pendientes de devolución');
      
      const response = await axiosInstance.get<PaginatedResponse<LoanWithDetails>>(
        `${LOAN_ENDPOINTS.PENDING_RETURNS}?${params.toString()}`
      );

      console.log(`✅ LoanService: ${response.data.data.length} préstamos pendientes de devolución`);
      return response.data;
    } catch (error: any) {
      console.error('❌ LoanService: Error al obtener préstamos pendientes:', error);
      throw error;
    }
  }
}