// src/utils/loan.utils.ts
// ================================================================
// UTILIDADES PARA EL SISTEMA DE PRÉSTAMOS
// ================================================================

import { format, addDays, differenceInDays } from 'date-fns';
import type { Person, Resource } from '@/types/api.types';
import { LOAN_CONFIG } from '@/config/loan.config';

/**
 * Utilidades para cálculos de préstamos
 */
export class LoanUtils {
  
  /**
   * Calcular fecha de vencimiento
   */
  static calculateDueDate(loanDate: Date = new Date(), personType?: string): Date {
    const days = personType === 'teacher' 
      ? LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.teacher.maxLoanDays
      : LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.student.maxLoanDays;
    
    return addDays(loanDate, days);
  }
  
  /**
   * Verificar si un préstamo está vencido
   */
  static isLoanOverdue(dueDate: Date): boolean {
    return differenceInDays(new Date(), dueDate) > 0;
  }
  
  /**
   * Calcular días de retraso
   */
  static calculateOverdueDays(dueDate: Date): number {
    const days = differenceInDays(new Date(), dueDate);
    return Math.max(0, days);
  }
  
  /**
   * Obtener límite máximo de préstamos para una persona
   */
  static getMaxLoansForPerson(personType?: string): number {
    if (!personType) return LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.student.maxLoans;
    
    return personType === 'teacher'
      ? LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.teacher.maxLoans
      : LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.student.maxLoans;
  }
  
  /**
   * Obtener cantidad máxima por préstamo para una persona
   */
  static getMaxQuantityForPerson(personType?: string): number {
    if (!personType) return LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.student.maxQuantityPerLoan;
    
    return personType === 'teacher'
      ? LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.teacher.maxQuantityPerLoan
      : LOAN_CONFIG.LIMITS_BY_PERSON_TYPE.student.maxQuantityPerLoan;
  }
  
  /**
   * Formatear información de persona para mostrar
   */
  static formatPersonInfo(person: Person): string {
    const fullName = person.fullName || `${person.firstName} ${person.lastName}`;
    const type = person.personType?.name === 'student' ? 'Estudiante' : 'Profesor';
    const doc = person.documentNumber ? ` (${person.documentNumber})` : '';
    
    return `${fullName} - ${type}${doc}`;
  }
  
  /**
   * Formatear información de recurso para mostrar
   */
  static formatResourceInfo(resource: Resource): string {
    let info = resource.title;
    if (resource.author) info += ` por ${resource.author}`;
    if (resource.isbn) info += ` (ISBN: ${resource.isbn})`;
    
    return info;
  }
  
  /**
   * Verificar si un recurso puede ser prestado
   */
  static canResourceBeLoaned(
    resource: Resource, 
    requestedQuantity: number = 1
  ): { canLoan: boolean; reason?: string } {
    // Verificar si está disponible
    if (!resource.available) {
      return { canLoan: false, reason: 'Recurso no disponible' };
    }
    
    // Verificar estado
    if (resource.state && !LOAN_CONFIG.ALLOWED_RESOURCE_STATES.includes(resource.state.name)) {
      return { canLoan: false, reason: `Estado no permitido: ${resource.state.name}` };
    }
    
    // Verificar stock
    const availableQuantity = (resource.totalQuantity || 0) - (resource.currentLoansCount || 0);
    if (availableQuantity < requestedQuantity) {
      return { 
        canLoan: false, 
        reason: `Stock insuficiente. Disponible: ${availableQuantity}, Solicitado: ${requestedQuantity}` 
      };
    }
    
    return { canLoan: true };
  }
  
  /**
   * Verificar si una persona puede pedir prestado
   */
  static canPersonBorrow(
    person: Person,
    activeLoansCount: number = 0,
    hasOverdueLoans: boolean = false
  ): { canBorrow: boolean; reason?: string } {
    // Verificar préstamos vencidos
    if (hasOverdueLoans) {
      return { canBorrow: false, reason: 'Tiene préstamos vencidos pendientes' };
    }
    
    // Verificar límite de préstamos activos
    const maxLoans = this.getMaxLoansForPerson(person.personType?.name);
    if (activeLoansCount >= maxLoans) {
      return { 
        canBorrow: false, 
        reason: `Ha alcanzado el límite máximo de préstamos (${maxLoans})` 
      };
    }
    
    return { canBorrow: true };
  }
  
  /**
   * Generar resumen de validación
   */
  static generateValidationSummary(
    person: Person,
    resource: Resource,
    quantity: number,
    activeLoansCount: number = 0,
    hasOverdueLoans: boolean = false
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validar persona
    const personValidation = this.canPersonBorrow(person, activeLoansCount, hasOverdueLoans);
    if (!personValidation.canBorrow) {
      errors.push(personValidation.reason!);
    }
    
    // Validar recurso
    const resourceValidation = this.canResourceBeLoaned(resource, quantity);
    if (!resourceValidation.canLoan) {
      errors.push(resourceValidation.reason!);
    }
    
    // Validar cantidad
    const maxQuantity = this.getMaxQuantityForPerson(person.personType?.name);
    if (quantity > maxQuantity) {
      errors.push(`Cantidad excede el límite permitido (${maxQuantity})`);
    }
    
    // Generar advertencias
    const availableQuantity = (resource.totalQuantity || 0) - (resource.currentLoansCount || 0);
    if (availableQuantity <= 2 && resourceValidation.canLoan) {
      warnings.push('Quedan pocas unidades disponibles');
    }
    
    if (resource.state?.name === 'deteriorated') {
      warnings.push('El recurso está en estado deteriorado');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Utilidades para formateo de fechas específicas de préstamos
 */
export class DateUtils {
  
  static formatLoanDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
  }
  
  static formatLoanDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm');
  }
  
  static getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const days = differenceInDays(new Date(), dateObj);
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days === -1) return 'Mañana';
    if (days > 0) return `Hace ${days} días`;
    return `En ${Math.abs(days)} días`;
  }
}