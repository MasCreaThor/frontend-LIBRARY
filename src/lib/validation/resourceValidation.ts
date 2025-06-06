// src/lib/validation/resourceValidation.ts
import { z } from 'zod';
import { ValidationUtils } from '@/utils';

/**
 * Sistema de validaciones para recursos
 * Separa la lógica de validación de los componentes UI
 */

// Validaciones base para campos comunes
const baseFieldValidations = {
  title: z
    .string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(300, 'El título no puede exceder 300 caracteres')
    .transform(val => val.trim()),

  typeId: z
    .string()
    .min(1, 'Debes seleccionar un tipo de recurso'),

  categoryId: z
    .string()
    .min(1, 'Debes seleccionar una categoría'),

  stateId: z
    .string()
    .min(1, 'Debes seleccionar un estado'),

  locationId: z
    .string()
    .min(1, 'Debes seleccionar una ubicación'),

  volumes: z
    .number()
    .int('El número de volúmenes debe ser entero')
    .min(1, 'Debe tener al menos 1 volumen')
    .max(100, 'No puede exceder 100 volúmenes')
    .optional()
    .default(1),

  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .transform(val => val?.trim() || undefined),

  isbn: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Opcional
      return ValidationUtils.isValidISBN(val);
    }, 'El ISBN debe tener un formato válido (10 o 13 dígitos)')
    .transform(val => val?.trim() || undefined),

  authorIds: z
    .array(z.string())
    .optional()
    .transform(val => val?.filter(id => id.trim() !== '') || []),

  publisherId: z
    .string()
    .optional()
    .transform(val => val?.trim() || undefined),

  googleBooksId: z
    .string()
    .optional()
    .transform(val => val?.trim() || undefined),
};

// Schema base para todos los recursos
export const baseResourceSchema = z.object({
  title: baseFieldValidations.title,
  typeId: baseFieldValidations.typeId,
  categoryId: baseFieldValidations.categoryId,
  stateId: baseFieldValidations.stateId,
  locationId: baseFieldValidations.locationId,
  volumes: baseFieldValidations.volumes,
  notes: baseFieldValidations.notes,
  authorIds: baseFieldValidations.authorIds,
  publisherId: baseFieldValidations.publisherId,
});

// Schema para libros (requiere más validaciones)
export const bookResourceSchema = baseResourceSchema.extend({
  isbn: baseFieldValidations.isbn,
  authorIds: z
    .array(z.string())
    .min(1, 'Los libros deben tener al menos un autor')
    .transform(val => val.filter(id => id.trim() !== '')),
});

// Schema para otros tipos de recursos
export const otherResourceSchema = baseResourceSchema.extend({
  isbn: z.string().optional().transform(val => undefined), // No ISBN para juegos, mapas, etc.
});

// Schema para recursos desde Google Books
export const googleBooksResourceSchema = z.object({
  googleBooksId: z.string().min(1, 'ID de Google Books requerido'),
  categoryId: baseFieldValidations.categoryId,
  stateId: baseFieldValidations.stateId,
  locationId: baseFieldValidations.locationId,
  volumes: baseFieldValidations.volumes,
  notes: baseFieldValidations.notes,
});

// Schema para actualización (todos los campos opcionales)
export const updateResourceSchema = z.object({
  title: baseFieldValidations.title.optional(),
  typeId: baseFieldValidations.typeId.optional(),
  categoryId: baseFieldValidations.categoryId.optional(),
  stateId: baseFieldValidations.stateId.optional(),
  locationId: baseFieldValidations.locationId.optional(),
  volumes: baseFieldValidations.volumes.optional(),
  notes: baseFieldValidations.notes.optional(),
  isbn: baseFieldValidations.isbn.optional(),
  authorIds: baseFieldValidations.authorIds.optional(),
  publisherId: baseFieldValidations.publisherId.optional(),
  available: z.boolean().optional(),
});

// Tipos derivados de los schemas
export type BaseResourceFormData = z.infer<typeof baseResourceSchema>;
export type BookResourceFormData = z.infer<typeof bookResourceSchema>;
export type OtherResourceFormData = z.infer<typeof otherResourceSchema>;
export type GoogleBooksResourceFormData = z.infer<typeof googleBooksResourceSchema>;
export type UpdateResourceFormData = z.infer<typeof updateResourceSchema>;

// Tipo dinámico que cambia según el tipo de recurso
export type DynamicResourceFormData = BaseResourceFormData & {
  isbn?: string;
};

/**
 * Factory para obtener el schema apropiado según el tipo de recurso
 */
export class ResourceValidationSchemaFactory {
  /**
   * Obtiene el schema de validación apropiado para un tipo específico
   */
  static getSchema(resourceType: string): z.ZodSchema {
    switch (resourceType) {
      case 'book':
        return bookResourceSchema;
      case 'game':
      case 'map':
      case 'bible':
        return otherResourceSchema;
      default:
        return baseResourceSchema;
    }
  }

  /**
   * Obtiene el schema para creación desde Google Books
   */
  static getGoogleBooksSchema(): z.ZodSchema {
    return googleBooksResourceSchema;
  }

  /**
   * Obtiene el schema para actualización
   */
  static getUpdateSchema(): z.ZodSchema {
    return updateResourceSchema;
  }

  /**
   * Valida datos de recurso según su tipo
   */
  static validateResourceData(
    data: any, 
    resourceType: string
  ): { success: boolean; data?: any; error?: z.ZodError } {
    const schema = this.getSchema(resourceType);
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  }

  /**
   * Obtiene mensajes de error formateados
   */
  static getFormattedErrors(error: z.ZodError): Record<string, string> {
    const formattedErrors: Record<string, string> = {};
    
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      formattedErrors[path] = err.message;
    });
    
    return formattedErrors;
  }

  /**
   * Valida si un campo específico es válido
   */
  static validateField(
    fieldName: keyof BaseResourceFormData,
    value: any,
    resourceType: string
  ): { isValid: boolean; error?: string } {
    try {
      const tempData = { [fieldName]: value };
      
      const schema = this.getSchema(resourceType);
      const result = schema.safeParse(tempData);
      
      if (result.success) {
        return { isValid: true };
      }
      
      // Buscar errores específicos del campo
      const fieldError = result.error.errors.find(err => 
        err.path.length > 0 && err.path[0] === fieldName
      );
      
      if (fieldError) {
        return { 
          isValid: false, 
          error: fieldError.message 
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Error de validación' };
    }
  }
}

/**
 * Reglas de negocio para validación de recursos
 */
export class ResourceBusinessRules {
  /**
   * Valida reglas de negocio específicas para libros
   */
  static validateBookRules(data: Partial<DynamicResourceFormData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Los libros deben tener autores
    if (!data.authorIds || data.authorIds.length === 0) {
      errors.push('Los libros deben tener al menos un autor');
    }

    // Validar ISBN si está presente
    if (data.isbn) {
      if (!ValidationUtils.isValidISBN(data.isbn)) {
        errors.push('El ISBN debe tener un formato válido');
      }
    }

    // Los libros deberían tener volúmenes válidos
    if (data.volumes && data.volumes > 50) {
      errors.push('Un libro no debería tener más de 50 volúmenes');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida reglas de negocio específicas para juegos
   */
  static validateGameRules(data: Partial<DynamicResourceFormData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Los juegos no deberían tener ISBN
    if (data.isbn && data.isbn.trim() !== '') {
      errors.push('Los juegos no utilizan ISBN');
    }

    // Los juegos generalmente son de 1 volumen
    if (data.volumes && data.volumes > 1) {
      errors.push('Los juegos generalmente son de 1 unidad');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida reglas de negocio específicas para mapas
   */
  static validateMapRules(data: Partial<DynamicResourceFormData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Los mapas no deberían tener ISBN
    if (data.isbn && data.isbn.trim() !== '') {
      errors.push('Los mapas no utilizan ISBN');
    }

    // Los mapas generalmente son de 1 volumen
    if (data.volumes && data.volumes > 1) {
      errors.push('Los mapas generalmente son de 1 unidad');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida reglas de negocio específicas para biblias
   */
  static validateBibleRules(data: Partial<DynamicResourceFormData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Las biblias pueden tener ISBN
    if (data.isbn && !ValidationUtils.isValidISBN(data.isbn)) {
      errors.push('El ISBN debe tener un formato válido');
    }

    // Las biblias generalmente son de pocos volúmenes
    if (data.volumes && data.volumes > 10) {
      errors.push('Una biblia no debería tener más de 10 volúmenes');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida reglas generales de negocio
   */
  static validateGeneralRules(data: Partial<DynamicResourceFormData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar longitud del título
    if (data.title && data.title.length > 200) {
      errors.push('El título es demasiado largo para mostrar correctamente');
    }

    // Validar que las notas no contengan contenido inapropiado
    if (data.notes) {
      const inappropriateWords = ['spam', 'promoción', 'venta'];
      const hasInappropriateContent = inappropriateWords.some(word =>
        data.notes!.toLowerCase().includes(word)
      );

      if (hasInappropriateContent) {
        errors.push('Las notas contienen contenido no apropiado');
      }
    }

    // Validar número de volúmenes razonable
    if (data.volumes && data.volumes > 100) {
      errors.push('El número de volúmenes parece excesivo');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validación completa de reglas de negocio según tipo de recurso
   */
  static validateAllRules(
    data: Partial<DynamicResourceFormData>, 
    resourceType: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const generalValidation = this.validateGeneralRules(data);
    
    let specificValidation = { isValid: true, errors: [] as string[] };
    
    switch (resourceType) {
      case 'book':
        specificValidation = this.validateBookRules(data);
        break;
      case 'game':
        specificValidation = this.validateGameRules(data);
        break;
      case 'map':
        specificValidation = this.validateMapRules(data);
        break;
      case 'bible':
        specificValidation = this.validateBibleRules(data);
        break;
    }

    return {
      isValid: generalValidation.isValid && specificValidation.isValid,
      errors: [...generalValidation.errors, ...specificValidation.errors],
    };
  }

  /**
   * Valida datos específicos de Google Books
   */
  static validateGoogleBooksData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.googleBooksId) {
      errors.push('ID de Google Books es requerido');
    }

    if (!data.categoryId) {
      errors.push('Debe seleccionar una categoría');
    }

    if (!data.stateId) {
      errors.push('Debe seleccionar un estado');
    }

    if (!data.locationId) {
      errors.push('Debe seleccionar una ubicación');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Utilidades para transformación de datos
 */
export class ResourceDataTransformer {
  /**
   * Transforma datos de Google Books a formato de recurso
   */
  static transformFromGoogleBooks(
    volumeData: any,
    userSelections: {
      categoryId: string;
      stateId: string;
      locationId: string;
      volumes?: number;
      notes?: string;
    }
  ): GoogleBooksResourceFormData {
    return {
      googleBooksId: volumeData.id,
      categoryId: userSelections.categoryId,
      stateId: userSelections.stateId,
      locationId: userSelections.locationId,
      volumes: userSelections.volumes || 1,
      notes: userSelections.notes || undefined,
    };
  }

  /**
   * Limpia y formatea datos antes del envío
   */
  static cleanFormData(data: DynamicResourceFormData, resourceType: string): DynamicResourceFormData {
    const cleaned = { ...data };

    // Limpiar título
    cleaned.title = data.title.trim();

    // Limpiar notas
    if (cleaned.notes) {
      cleaned.notes = cleaned.notes.trim();
      if (cleaned.notes === '') {
        cleaned.notes = undefined;
      }
    }

    // Limpiar ISBN según tipo de recurso
    if (resourceType !== 'book' && resourceType !== 'bible') {
      cleaned.isbn = undefined;
    } else if (cleaned.isbn) {
      cleaned.isbn = cleaned.isbn.replace(/[-\s]/g, '');
    }

    // Limpiar autorías según tipo
    if (resourceType !== 'book' && resourceType !== 'bible') {
      cleaned.authorIds = [];
    }

    return cleaned;
  }

  /**
   * Extrae datos comunes de validación
   */
  static extractValidationSummary(errors: string[]): {
    hasFieldErrors: boolean;
    hasBusinessErrors: boolean;
    criticalErrors: string[];
    warnings: string[];
  } {
    const fieldErrorKeywords = ['requerido', 'debe tener', 'formato válido', 'seleccionar'];
    const criticalKeywords = ['ISBN', 'autor', 'tipo'];

    const fieldErrors = errors.filter(error =>
      fieldErrorKeywords.some(keyword => error.toLowerCase().includes(keyword))
    );

    const businessErrors = errors.filter(error =>
      !fieldErrorKeywords.some(keyword => error.toLowerCase().includes(keyword))
    );

    const criticalErrors = errors.filter(error =>
      criticalKeywords.some(keyword => error.toLowerCase().includes(keyword))
    );

    const warnings = businessErrors.filter(error =>
      !criticalErrors.includes(error)
    );

    return {
      hasFieldErrors: fieldErrors.length > 0,
      hasBusinessErrors: businessErrors.length > 0,
      criticalErrors,
      warnings,
    };
  }
}