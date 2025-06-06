// src/services/resource.service.ts
import axiosInstance from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Resource,
  ResourceType,
  Category,
  Location,
  ResourceState,
  SearchFilters,
} from '@/types/api.types';

const RESOURCE_ENDPOINTS = {
  RESOURCES: '/resources',
  RESOURCE_BY_ID: (id: string) => `/resources/${id}`,
  RESOURCE_BY_ISBN: (isbn: string) => `/resources/isbn/${isbn}`,
  RESOURCE_TYPES: '/resource-types',
  CATEGORIES: '/categories/active',
  LOCATIONS: '/locations/active', 
  RESOURCE_STATES: '/resource-states',
  AUTHORS: '/authors',
  PUBLISHERS: '/publishers',
  STATS: '/resources/stats/summary',
  FROM_GOOGLE_BOOKS: '/resources/from-google-books',
  AVAILABILITY: (id: string) => `/resources/${id}/availability`,
} as const;

// DTOs específicos para recursos
export interface CreateResourceDto {
  typeId: string;
  categoryId: string;
  title: string;
  authorIds?: string[];
  publisherId?: string;
  volumes?: number;
  stateId: string;
  locationId: string;
  notes?: string;
  isbn?: string;
}

export interface ResourceFromGoogleBooksDto {
  googleBooksId: string;
  categoryId: string;
  stateId: string;
  locationId: string;
  volumes?: number;
  notes?: string;
}

export interface UpdateResourceDto {
  typeId?: string;
  categoryId?: string;
  title?: string;
  authorIds?: string[];
  publisherId?: string;
  volumes?: number;
  stateId?: string;
  locationId?: string;
  notes?: string;
  available?: boolean;
  isbn?: string;
}

export interface ResourceSearchDto extends SearchFilters {
  resourceType?: 'book' | 'game' | 'map' | 'bible';
  categoryId?: string;
  locationId?: string;
  stateId?: string;
  availability?: 'available' | 'borrowed';
  isbn?: string;
  author?: string;
  publisher?: string;
}

export interface Author {
  _id: string;
  name: string;
  biography?: string;
  googleBooksAuthorId?: string;
  active: boolean;
}

export interface Publisher {
  _id: string;
  name: string;
  description?: string;
  googleBooksPublisherId?: string;
  active: boolean;
}

export interface ResourceStats {
  total: number;
  available: number;
  borrowed: number;
  byType: Array<{ type: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byState: Array<{ state: string; count: number }>;
  recentlyAdded: number;
}

export class ResourceService {
  /**
   * Crear un nuevo recurso manual
   */
  static async createResource(resourceData: CreateResourceDto): Promise<Resource> {
    const response = await axiosInstance.post<ApiResponse<Resource>>(
      RESOURCE_ENDPOINTS.RESOURCES,
      resourceData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al crear recurso');
  }

  /**
   * Crear recurso desde Google Books
   */
  static async createResourceFromGoogleBooks(resourceData: ResourceFromGoogleBooksDto): Promise<Resource> {
    const response = await axiosInstance.post<ApiResponse<Resource>>(
      RESOURCE_ENDPOINTS.FROM_GOOGLE_BOOKS,
      resourceData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al crear recurso desde Google Books');
  }

  /**
   * Obtener todos los recursos con filtros
   */
  static async getResources(filters: ResourceSearchDto = {}): Promise<PaginatedResponse<Resource>> {
    const params = new URLSearchParams();

    // Agregar parámetros de filtro
    if (filters.search) params.append('search', filters.search);
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.locationId) params.append('locationId', filters.locationId);
    if (filters.stateId) params.append('stateId', filters.stateId);
    if (filters.availability) params.append('availability', filters.availability);
    if (filters.isbn) params.append('isbn', filters.isbn);
    if (filters.author) params.append('author', filters.author);
    if (filters.publisher) params.append('publisher', filters.publisher);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Resource>>>(
      `${RESOURCE_ENDPOINTS.RESOURCES}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener recursos');
  }

  /**
   * Obtener recurso por ID
   */
  static async getResourceById(id: string): Promise<Resource> {
    const response = await axiosInstance.get<ApiResponse<Resource>>(
      RESOURCE_ENDPOINTS.RESOURCE_BY_ID(id)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener recurso');
  }

  /**
   * Buscar recurso por ISBN
   */
  static async getResourceByISBN(isbn: string): Promise<Resource> {
    const response = await axiosInstance.get<ApiResponse<Resource>>(
      RESOURCE_ENDPOINTS.RESOURCE_BY_ISBN(isbn)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener recurso por ISBN');
  }

  /**
   * Actualizar recurso
   */
  static async updateResource(id: string, resourceData: UpdateResourceDto): Promise<Resource> {
    const response = await axiosInstance.put<ApiResponse<Resource>>(
      RESOURCE_ENDPOINTS.RESOURCE_BY_ID(id),
      resourceData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al actualizar recurso');
  }

  /**
   * Cambiar disponibilidad del recurso
   */
  static async updateAvailability(id: string, available: boolean): Promise<Resource> {
    const response = await axiosInstance.put<ApiResponse<Resource>>(
      RESOURCE_ENDPOINTS.AVAILABILITY(id),
      { available }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al actualizar disponibilidad');
  }

  /**
   * Eliminar recurso
   */
  static async deleteResource(id: string): Promise<void> {
    const response = await axiosInstance.delete<ApiResponse<null>>(
      RESOURCE_ENDPOINTS.RESOURCE_BY_ID(id)
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar recurso');
    }
  }

  /**
   * Obtener tipos de recursos
   */
  static async getResourceTypes(): Promise<ResourceType[]> {
    const response = await axiosInstance.get<ApiResponse<ResourceType[]>>(
      RESOURCE_ENDPOINTS.RESOURCE_TYPES
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener tipos de recursos');
  }

  /**
   * Obtener categorías activas
   */
  static async getCategories(): Promise<Category[]> {
    const response = await axiosInstance.get<ApiResponse<Category[]>>(
      RESOURCE_ENDPOINTS.CATEGORIES
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener categorías');
  }

  /**
   * Obtener ubicaciones activas
   */
  static async getLocations(): Promise<Location[]> {
    const response = await axiosInstance.get<ApiResponse<Location[]>>(
      RESOURCE_ENDPOINTS.LOCATIONS
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener ubicaciones');
  }

  /**
   * Obtener estados de recursos
   */
  static async getResourceStates(): Promise<ResourceState[]> {
    const response = await axiosInstance.get<ApiResponse<ResourceState[]>>(
      RESOURCE_ENDPOINTS.RESOURCE_STATES
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener estados de recursos');
  }

  /**
   * Buscar autores
   */
  static async searchAuthors(query: string, limit = 20): Promise<Author[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());

    const response = await axiosInstance.get<ApiResponse<Author[]>>(
      `${RESOURCE_ENDPOINTS.AUTHORS}/search?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al buscar autores');
  }

  /**
   * Crear autores en lote
   */
  static async createAuthors(names: string[]): Promise<Author[]> {
    const response = await axiosInstance.post<ApiResponse<Author[]>>(
      `${RESOURCE_ENDPOINTS.AUTHORS}/bulk-create`,
      { names }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al crear autores');
  }

  /**
   * Buscar o crear editorial
   */
  static async findOrCreatePublisher(name: string): Promise<Publisher> {
    const response = await axiosInstance.post<ApiResponse<Publisher>>(
      `${RESOURCE_ENDPOINTS.PUBLISHERS}/find-or-create`,
      { name }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al buscar/crear editorial');
  }

  /**
   * Obtener estadísticas de recursos
   */
  static async getResourceStats(): Promise<ResourceStats> {
    const response = await axiosInstance.get<ApiResponse<ResourceStats>>(
      RESOURCE_ENDPOINTS.STATS
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener estadísticas');
  }

  /**
   * Búsqueda simple de recursos
   */
  static async searchResources(query: string, limit = 10): Promise<Resource[]> {
    const response = await this.getResources({
      search: query,
      limit,
      page: 1,
    });

    return response.data;
  }

  /**
   * Verificar disponibilidad de recurso
   */
  static async isResourceAvailable(id: string): Promise<boolean> {
    try {
      const resource = await this.getResourceById(id);
      return resource.available;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener recursos por categoría
   */
  static async getResourcesByCategory(categoryId: string, filters: ResourceSearchDto = {}): Promise<PaginatedResponse<Resource>> {
    return this.getResources({
      ...filters,
      categoryId,
    });
  }

  /**
   * Obtener recursos por tipo
   */
  static async getResourcesByType(type: 'book' | 'game' | 'map' | 'bible', filters: ResourceSearchDto = {}): Promise<PaginatedResponse<Resource>> {
    return this.getResources({
      ...filters,
      resourceType: type,
    });
  }

  /**
   * Validar ISBN único
   */
  static async validateISBN(isbn: string, excludeId?: string): Promise<boolean> {
    try {
      const resource = await this.getResourceByISBN(isbn);
      // Si encuentra un recurso y no es el que estamos excluyendo, el ISBN ya existe
      return excludeId ? resource._id !== excludeId : false;
    } catch (error) {
      // Si no encuentra el recurso, el ISBN está disponible
      return true;
    }
  }
}