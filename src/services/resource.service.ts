// src/services/resource.service.ts - VERSIÓN CORREGIDA
import axiosInstance from '@/lib/axios';
import type {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceFilters,
  Category,
  Author,
  Publisher,
  Location,
  ResourceType,
  ResourceState,
  GoogleBooksVolume,
  CreateResourceFromGoogleBooksRequest,
  ResourceResponse,
  ResourceListResponse,
  CategoryListResponse,
  AuthorListResponse,
  PublisherListResponse,
  LocationListResponse,
  ResourceTypeListResponse,
  ResourceStateListResponse,
  GoogleBooksSearchResponse,
} from '@/types/resource.types';

// Importar ApiResponse para respuestas específicas
import type { ApiResponse } from '@/types/api.types';

const RESOURCE_ENDPOINTS = {
  RESOURCES: '/resources',
  RESOURCE_BY_ID: (id: string) => `/resources/${id}`,
  RESOURCE_BY_ISBN: (isbn: string) => `/resources/isbn/${isbn}`,
  AVAILABILITY: (id: string) => `/resources/${id}/availability`,
  
  // Entidades auxiliares
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,
  AUTHORS: '/authors',
  AUTHOR_BY_ID: (id: string) => `/authors/${id}`,
  AUTHOR_SEARCH: '/authors/search',
  AUTHOR_BULK_CREATE: '/authors/bulk-create',
  PUBLISHERS: '/publishers',
  PUBLISHER_BY_ID: (id: string) => `/publishers/${id}`,
  PUBLISHER_FIND_OR_CREATE: '/publishers/find-or-create',
  LOCATIONS: '/locations',
  LOCATION_BY_ID: (id: string) => `/locations/${id}`,
  RESOURCE_TYPES: '/resource-types',
  RESOURCE_STATES: '/resource-states',
  
  // Google Books
  GOOGLE_BOOKS_SEARCH: '/google-books/search',
  GOOGLE_BOOKS_ISBN: (isbn: string) => `/google-books/isbn/${isbn}`,
  GOOGLE_BOOKS_VOLUME: (id: string) => `/google-books/volume/${id}`,
  GOOGLE_BOOKS_STATUS: '/google-books/status',
  GOOGLE_BOOKS_CREATE: '/resources/google-books',
  GOOGLE_BOOKS_PREVIEW: (volumeId: string) => `/resources/google-books/preview/${volumeId}`,
  GOOGLE_BOOKS_CHECK: (volumeId: string) => `/resources/google-books/check/${volumeId}`,
} as const;

export class ResourceService {
  // ===== RECURSOS PRINCIPALES =====
  
  /**
   * Obtener recursos con filtros - VERSIÓN CORREGIDA
   */
  static async getResources(filters: ResourceFilters = {}): Promise<ResourceListResponse> {
    try {
      const params = new URLSearchParams();
      
      // Parámetros básicos
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.typeId) params.append('typeId', filters.typeId);
      if (filters.locationId) params.append('locationId', filters.locationId);
      
      // IMPORTANTE: Mapear correctamente el filtro de disponibilidad
      if (filters.available !== undefined) {
        params.append('availability', filters.available ? 'available' : 'borrowed');
      } else if (filters.availability) {
        params.append('availability', filters.availability);
      }
      
      if (filters.authorId) params.append('authorId', filters.authorId);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const url = `${RESOURCE_ENDPOINTS.RESOURCES}?${params.toString()}`;
      
      console.log('🔍 ResourceService: Buscando recursos con filtros:', {
        url,
        filters,
        params: params.toString()
      });

      const response = await axiosInstance.get<ResourceListResponse>(url);

      console.log('✅ ResourceService: Respuesta recibida:', {
        success: response.data.success,
        dataLength: response.data.data?.data?.length || 0,
        total: response.data.data?.pagination?.total || 0,
        status: response.status
      });
      
      if (response.data.success && response.data.data) {
        return response.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener recursos');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al buscar recursos:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Si hay problema de conectividad
      if (!error.response) {
        console.error('🌐 ResourceService: Error de conectividad');
        throw new Error('Error de conexión. Verifica que el backend esté funcionando.');
      }
      
      // Si es error 500, intentar método de fallback
      if (error.response?.status === 500) {
        console.warn('🔄 ResourceService: Intentando método de fallback...');
        return ResourceService.getResourcesWithFallback(filters);
      }
      
      throw error;
    }
  }

  /**
   * Método de fallback para cuando falla la búsqueda principal
   */
  private static async getResourcesWithFallback(filters: ResourceFilters): Promise<ResourceListResponse> {
    try {
      // Intentar con parámetros más simples
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', (filters.limit || 10).toString());
      
      // Solo filtros básicos sin populate
      params.append('populate', 'false');

      console.log('🔄 ResourceService: Fallback con parámetros simples:', params.toString());

      const response = await axiosInstance.get<ResourceListResponse>(
        `${RESOURCE_ENDPOINTS.RESOURCES}?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Fallback exitoso');
        return response.data;
      }

      throw new Error('Fallback falló');
    } catch (error) {
      console.error('❌ ResourceService: Fallback falló:', error);
      
      // Último recurso: estructura vacía válida
      console.warn('🆘 ResourceService: Usando estructura vacía como último recurso');
      return {
        success: true,
        message: 'Sin resultados disponibles',
        data: {
          data: [],
          pagination: {
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 10,
            pages: 0
          }
        }
      };
    }
  }
  
  /**
   * Obtener recurso por ID
   */
  static async getResourceById(id: string): Promise<Resource> {
    try {
      console.log('🔍 ResourceService: Buscando recurso por ID:', id);

      const response = await axiosInstance.get<ResourceResponse>(
        RESOURCE_ENDPOINTS.RESOURCE_BY_ID(id)
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Recurso encontrado:', response.data.data._id);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener recurso');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener recurso por ID:', {
        id,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }
  
  /**
   * Obtener recurso por ISBN
   */
  static async getResourceByISBN(isbn: string): Promise<Resource> {
    try {
      console.log('🔍 ResourceService: Buscando recurso por ISBN:', isbn);

      const response = await axiosInstance.get<ResourceResponse>(
        RESOURCE_ENDPOINTS.RESOURCE_BY_ISBN(isbn)
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Recurso encontrado por ISBN');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al buscar recurso por ISBN');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al buscar por ISBN:', {
        isbn,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Crear nuevo recurso
   */
  static async createResource(resourceData: CreateResourceRequest): Promise<Resource> {
    try {
      console.log('➕ ResourceService: Creando nuevo recurso:', resourceData.title);

      const response = await axiosInstance.post<ResourceResponse>(
        RESOURCE_ENDPOINTS.RESOURCES,
        resourceData
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Recurso creado exitosamente');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al crear recurso');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al crear recurso:', {
        title: resourceData.title,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Actualizar recurso
   */
  static async updateResource(id: string, resourceData: UpdateResourceRequest): Promise<Resource> {
    try {
      console.log('🔄 ResourceService: Actualizando recurso:', id);

      const response = await axiosInstance.put<ResourceResponse>(
        RESOURCE_ENDPOINTS.RESOURCE_BY_ID(id),
        resourceData
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Recurso actualizado exitosamente');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al actualizar recurso');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al actualizar recurso:', {
        id,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Actualizar disponibilidad del recurso
   */
  static async updateAvailability(id: string, available: boolean): Promise<Resource> {
    try {
      console.log('🔄 ResourceService: Actualizando disponibilidad:', { id, available });

      const response = await axiosInstance.put<ResourceResponse>(
        RESOURCE_ENDPOINTS.AVAILABILITY(id),
        { available }
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Disponibilidad actualizada');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al actualizar disponibilidad');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al actualizar disponibilidad:', {
        id,
        available,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Eliminar recurso
   */
  static async deleteResource(id: string): Promise<void> {
    try {
      console.log('🗑️ ResourceService: Eliminando recurso:', id);

      const response = await axiosInstance.delete<ApiResponse<null>>(
        RESOURCE_ENDPOINTS.RESOURCE_BY_ID(id)
      );
      
      if (response.data.success) {
        console.log('✅ ResourceService: Recurso eliminado exitosamente');
        return;
      }
      
      throw new Error(response.data.message || 'Error al eliminar recurso');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al eliminar recurso:', {
        id,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  // ===== CATEGORÍAS =====
  
  /**
   * Obtener todas las categorías
   */
  static async getCategories(): Promise<Category[]> {
    try {
      console.log('📂 ResourceService: Obteniendo categorías');

      const response = await axiosInstance.get<CategoryListResponse>(
        RESOURCE_ENDPOINTS.CATEGORIES
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Categorías obtenidas:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener categorías');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener categorías:', error.message);
      throw error;
    }
  }

  // ===== TIPOS DE RECURSOS =====
  
  /**
   * Obtener tipos de recursos
   */
  static async getResourceTypes(): Promise<ResourceType[]> {
    try {
      console.log('📋 ResourceService: Obteniendo tipos de recursos');

      const response = await axiosInstance.get<ResourceTypeListResponse>(
        RESOURCE_ENDPOINTS.RESOURCE_TYPES
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Tipos de recursos obtenidos:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener tipos de recursos');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener tipos de recursos:', error.message);
      throw error;
    }
  }

  // ===== UBICACIONES =====
  
  /**
   * Obtener ubicaciones
   */
  static async getLocations(): Promise<Location[]> {
    try {
      console.log('📍 ResourceService: Obteniendo ubicaciones');

      const response = await axiosInstance.get<LocationListResponse>(
        RESOURCE_ENDPOINTS.LOCATIONS
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Ubicaciones obtenidas:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener ubicaciones');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener ubicaciones:', error.message);
      throw error;
    }
  }

  // ===== ESTADOS DE RECURSOS =====
  
  /**
   * Obtener estados de recursos
   */
  static async getResourceStates(): Promise<ResourceState[]> {
    try {
      console.log('🏷️ ResourceService: Obteniendo estados de recursos');

      const response = await axiosInstance.get<ResourceStateListResponse>(
        RESOURCE_ENDPOINTS.RESOURCE_STATES
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Estados de recursos obtenidos:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener estados de recursos');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener estados de recursos:', error.message);
      throw error;
    }
  }

  // ===== AUTORES =====
  
  /**
   * Obtener autores
   */
  static async getAuthors(): Promise<Author[]> {
    try {
      console.log('👨‍💼 ResourceService: Obteniendo autores');

      const response = await axiosInstance.get<AuthorListResponse>(
        RESOURCE_ENDPOINTS.AUTHORS
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Autores obtenidos:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener autores');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener autores:', error.message);
      throw error;
    }
  }

  // ===== EDITORIALES =====
  
  /**
   * Obtener editoriales
   */
  static async getPublishers(): Promise<Publisher[]> {
    try {
      console.log('🏢 ResourceService: Obteniendo editoriales');

      const response = await axiosInstance.get<PublisherListResponse>(
        RESOURCE_ENDPOINTS.PUBLISHERS
      );
      
      if (response.data.success && response.data.data) {
        console.log('✅ ResourceService: Editoriales obtenidas:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al obtener editoriales');
    } catch (error: any) {
      console.error('❌ ResourceService: Error al obtener editoriales:', error.message);
      throw error;
    }
  }

  static async checkGoogleBooksStatus(): Promise<ApiResponse<{ apiAvailable: boolean }>> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ apiAvailable: boolean }>>(
        RESOURCE_ENDPOINTS.GOOGLE_BOOKS_STATUS
      );
      return response.data;
    } catch (error) {
      console.error('Error al verificar el estado de Google Books:', error);
      throw error;
    }
  }

  static async searchGoogleBooks(query: string, maxResults: number): Promise<GoogleBooksSearchResponse> {
    try {
      const response = await axiosInstance.get<GoogleBooksSearchResponse>(
        `${RESOURCE_ENDPOINTS.GOOGLE_BOOKS_SEARCH}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al buscar en Google Books:', error);
      throw error;
    }
  }
}