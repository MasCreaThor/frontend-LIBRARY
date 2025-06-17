// src/config/loan.config.ts
// ================================================================
// CONFIGURACIÓN CENTRALIZADA DEL SISTEMA DE PRÉSTAMOS
// ================================================================

/**
 * Configuración principal del sistema de préstamos
 */
export const LOAN_CONFIG = {
  // Límites generales
  MAX_LOAN_DAYS: 15,
  MAX_LOANS_PER_PERSON: 5,
  MAX_QUANTITY_ABSOLUTE: 50,
  
  // Límites por tipo de persona
  LIMITS_BY_PERSON_TYPE: {
    student: {
      maxLoans: 3,
      maxQuantityPerLoan: 3,
      maxLoanDays: 15
    },
    teacher: {
      maxLoans: 10,
      maxQuantityPerLoan: 10,
      maxLoanDays: 30
    }
  },
  
  // Configuración de búsqueda
  SEARCH: {
    MIN_SEARCH_LENGTH: 2,
    DEBOUNCE_DELAY: 300,
    MAX_RESULTS: 20,
    DEFAULT_LIMIT: 10
  },
  
  // Configuración de cache (React Query)
  CACHE: {
    STALE_TIME: 5 * 60 * 1000,      // 5 minutos
    GC_TIME: 10 * 60 * 1000,        // 10 minutos
    VALIDATION_CACHE: 30 * 1000,    // 30 segundos
  },
  
  // Estados de recursos permitidos para préstamo
  ALLOWED_RESOURCE_STATES: ['good', 'deteriorated'],
  
  // Estados de préstamo
  LOAN_STATUSES: {
    ACTIVE: 'active',
    RETURNED: 'returned',
    OVERDUE: 'overdue',
    LOST: 'lost'
  },
  
  // Configuración de validación
  VALIDATION: {
    ENABLE_REALTIME: true,
    ENABLE_WARNINGS: true,
    STRICT_MODE: false
  }
} as const;

/**
 * Configuración de la interfaz de usuario
 */
export const UI_CONFIG = {
  // Colores por tipo de persona
  PERSON_TYPE_COLORS: {
    student: 'blue',
    teacher: 'purple'
  },
  
  // Colores por disponibilidad de recurso
  RESOURCE_AVAILABILITY_COLORS: {
    available: 'green',
    limited: 'orange',
    unavailable: 'red'
  },
  
  // Tamaños de modal
  MODAL_SIZES: {
    CREATE_LOAN: 'xl',
    RETURN_LOAN: 'lg',
    VIEW_DETAILS: 'md'
  },
  
  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  }
} as const;

/**
 * Mensajes del sistema
 */
export const MESSAGES = {
  SUCCESS: {
    LOAN_CREATED: 'Préstamo registrado exitosamente',
    LOAN_RETURNED: 'Préstamo devuelto correctamente',
    LOAN_RENEWED: 'Préstamo renovado exitosamente'
  },
  
  ERROR: {
    LOAN_CREATION_FAILED: 'Error al crear el préstamo',
    VALIDATION_FAILED: 'Por favor, corrija los errores antes de continuar',
    PERSON_NOT_SELECTED: 'Debe seleccionar una persona',
    RESOURCE_NOT_SELECTED: 'Debe seleccionar un recurso',
    NETWORK_ERROR: 'Error de conexión. Intente nuevamente'
  },
  
  WARNING: {
    LOW_STOCK: 'Quedan pocas unidades disponibles',
    PERSON_HAS_OVERDUE: 'La persona tiene préstamos vencidos',
    RESOURCE_DETERIORATED: 'El recurso está en estado deteriorado'
  },
  
  INFO: {
    VALIDATING: 'Validando préstamo...',
    SEARCHING: 'Buscando...',
    LOADING: 'Cargando...'
  }
} as const;