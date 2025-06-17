// src/components/loan/index.ts
// ================================================================
// EXPORTACIONES DE COMPONENTES DEL SISTEMA DE PRÉSTAMOS
// ================================================================

// Componente principal
export { default as LoanManagement } from './LoanManagement';

// Componentes de gestión básica
export { default as LoansList } from './LoansList';
export { default as LoanRow } from './LoanRow';
export { default as CreateLoanModal } from './CreateLoanModal';

// Componentes de devoluciones y vencidos
export { default as ReturnsManagement } from './ReturnsManagement';
export { default as OverdueManagement } from './OverdueManagement';
export { default as ReturnModal } from './ReturnModal';

// Componentes de estadísticas
export { default as LoanStatistics } from './LoanStatistics';

// Tipos para re-exportar (opcional)
export type {
  LoanWithDetails,
  CreateLoanRequest,
  ReturnLoanRequest,
  LoanSearchFilters,
  OverdueFilters
} from '@/types/loan.types';