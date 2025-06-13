// types/loan.types.ts - CORRECCIÓN COMPLETA
import type { Person, Resource, LoanStatus } from './api.types';

export type { LoanStatus };

export interface Loan {
    _id: string;
    personId: string;
    resourceId: string;
    quantity: number;
    loanDate: Date;
    dueDate: Date;
    returnedDate?: Date;
    statusId: string;
    observations?: string;
    loanedBy: string;
    returnedBy?: string;
    daysOverdue?: number;
    isOverdue?: boolean;
    createdAt: Date;
    updatedAt: Date;
  
    // Información poblada
    person?: Person;
    resource?: Resource;
    status?: LoanStatus;
}
  
export interface CreateLoanRequest {
    personId: string;
    resourceId: string;
    quantity?: number;
    observations?: string;
}
  
export interface ReturnLoanRequest {
    loanId: string;
    returnDate?: string;
    resourceCondition?: 'good' | 'deteriorated' | 'damaged' | 'lost';
    returnObservations?: string;
}
  
export interface LoanSearchFilters {
    search?: string;
    status?: 'active' | 'returned' | 'overdue' | 'lost';
    personId?: string;
    resourceId?: string;
    dateFrom?: string;
    dateTo?: string;
    isOverdue?: boolean;
    daysOverdue?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
  
export interface LoanStats {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    returnedLoans: number;
    averageLoanDuration: number;
    mostBorrowedResources: Array<{
      resourceId: string;
      title: string;
      borrowCount: number;
    }>;
}
  
export interface CanBorrowResult {
    canBorrow: boolean;
    reason?: string;
    overdueCount?: number;
    activeCount?: number;
    maxLoansAllowed?: number;
}
  
export interface ReturnLoanResponse {
    loan: Loan;
    daysOverdue: number;
    wasOverdue: boolean;
    resourceConditionChanged: boolean;
    message: string;
}