// src/components/inventory/ResourceForm/index.ts
// Barrel export para el módulo ResourceForm

// Componente principal
export { ResourceForm } from './ResourceForm';

// Hook personalizado
export { useResourceForm } from './useResourceForm';
export type { UseResourceFormOptions, UseResourceFormReturn } from './useResourceForm';

// Subcomponentes
export { ResourceBasicFields } from './ResourceBasicFields';
export { ResourceLocationFields } from './ResourceLocationFields';
export { ISBNValidationField } from './ISBNValidationField';
export { AuthorsSelector } from './AuthorsSelector';