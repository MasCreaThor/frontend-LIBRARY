// src/services/category.service.ts
import axiosInstance from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  active?: boolean;
}

export interface CategoryFilters {
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const CATEGORY_ENDPOINTS = {
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,
} as const;

export class CategoryService {
  /**
   * Obtener todas las categorías
   */
  static async getCategories(filters: CategoryFilters = {}): Promise<PaginatedResponse<Category>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.active !== undefined) params.append('active', filters.active.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Category>>>(
      `${CATEGORY_ENDPOINTS.CATEGORIES}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener categorías');
  }

  /**
   * Obtener categoría por ID
   */
  static async getCategoryById(id: string): Promise<Category> {
    const response = await axiosInstance.get<ApiResponse<Category>>(
      CATEGORY_ENDPOINTS.CATEGORY_BY_ID(id)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener categoría');
  }

  /**
   * Crear una nueva categoría
   */
  static async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await axiosInstance.post<ApiResponse<Category>>(
      CATEGORY_ENDPOINTS.CATEGORIES,
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al crear categoría');
  }

  /**
   * Actualizar una categoría
   */
  static async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await axiosInstance.put<ApiResponse<Category>>(
      CATEGORY_ENDPOINTS.CATEGORY_BY_ID(id),
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al actualizar categoría');
  }

  /**
   * Eliminar una categoría
   */
  static async deleteCategory(id: string): Promise<void> {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      CATEGORY_ENDPOINTS.CATEGORY_BY_ID(id)
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar categoría');
    }
  }

  /**
   * Obtener estadísticas de categorías
   */
  static async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    resourceCount: Record<string, number>;
  }> {
    try {
      // Intentar obtener estadísticas del endpoint específico
      const response = await axiosInstance.get<ApiResponse<any>>(
        `${CATEGORY_ENDPOINTS.CATEGORIES}/stats`
      );
  
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
  
      // Si el endpoint no retorna datos válidos, calcular desde la lista
      throw new Error('Endpoint de estadísticas no disponible');
    } catch (error: any) {
      console.warn('Endpoint de estadísticas no disponible, calculando desde datos existentes...');
      
      // Fallback: calcular estadísticas desde la lista de categorías
      try {
        const categoriesResponse = await this.getCategories({ limit: 1000 });
        
        // Verificar si la respuesta es paginada o array directo
        let categories: Category[];
        if (Array.isArray(categoriesResponse)) {
          categories = categoriesResponse as any;
        } else if (categoriesResponse.data) {
          categories = categoriesResponse.data;
        } else {
          categories = [];
        }
        
        const total = categories.length;
        const active = categories.filter(cat => cat.active).length;
        const inactive = total - active;
        
        // Por ahora, resourceCount será vacío ya que requiere una relación con recursos
        const resourceCount: Record<string, number> = {};
        
        return {
          total,
          active,
          inactive,
          resourceCount,
        };
      } catch (fallbackError) {
        console.error('Error calculando estadísticas de categorías:', fallbackError);
        
        // Último fallback: devolver estadísticas vacías
        return {
          total: 0,
          active: 0,
          inactive: 0,
          resourceCount: {},
        };
    }
  }
}
}