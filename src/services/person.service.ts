// src/services/person.service.ts - VERSIÓN CORREGIDA
import axiosInstance from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Person,
  PersonType,
  CreatePersonRequest,
  UpdatePersonRequest,
  SearchFilters,
} from '@/types/api.types';

const PERSON_ENDPOINTS = {
  PEOPLE: '/people',
  PERSON_BY_ID: (id: string) => `/people/${id}`,
  PERSON_BY_DOCUMENT: (document: string) => `/people/document/${document}`,
  PERSON_ACTIVATE: (id: string) => `/people/${id}/activate`,
  PERSON_DEACTIVATE: (id: string) => `/people/${id}/deactivate`,
  PERSON_STATS: '/people/stats/summary',
  PERSON_TYPES: '/people/types/all',
  PERSON_TYPE_BY_ID: (id: string) => `/people/types/${id}`,
} as const;

export class PersonService {
  /**
   * Crear una nueva persona
   */
  async createPerson(personData: CreatePersonRequest): Promise<Person> {
    const response = await axiosInstance.post<ApiResponse<Person>>(
      PERSON_ENDPOINTS.PEOPLE,
      personData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al crear persona');
  }

  /**
   * Obtener todas las personas con filtros - VERSIÓN CORREGIDA
   */
  async getPeople(filters: SearchFilters = {}): Promise<PaginatedResponse<Person>> {
    try {
      const params = new URLSearchParams();

      // Agregar parámetros de filtro
      if (filters.search) params.append('search', filters.search);
      if (filters.personType) params.append('personType', filters.personType);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      console.log('🔍 PersonService: Buscando personas con filtros:', {
        url: `${PERSON_ENDPOINTS.PEOPLE}?${params.toString()}`,
        filters
      });

      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Person>>>(
        `${PERSON_ENDPOINTS.PEOPLE}?${params.toString()}`
      );

      console.log('✅ PersonService: Respuesta recibida:', {
        success: response.data.success,
        dataLength: response.data.data?.data?.length || 0,
        total: response.data.data?.pagination?.total || 0
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener personas');
    } catch (error: any) {
      console.error('❌ PersonService: Error al buscar personas:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Si es error 500 y menciona populate, intentar método alternativo
      if (error?.response?.status === 500 && 
          error?.response?.data?.message?.includes('populate')) {
        console.warn('🔄 PersonService: Intentando método sin populate...');
        return this.getPeopleWithoutPopulate(filters);
      }
      
      // Si es error de red o timeout
      if (!error.response) {
        console.error('🌐 PersonService: Error de conectividad');
        throw new Error('Error de conexión. Verifica que el backend esté funcionando.');
      }
      
      throw error;
    }
  }

  /**
   * Método alternativo sin populate para casos de error
   */
  private async getPeopleWithoutPopulate(filters: SearchFilters): Promise<PaginatedResponse<Person>> {
    try {
      const params = new URLSearchParams();
      
      // Parámetros básicos sin populate
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      // Indicar explícitamente que no queremos populate
      params.append('populate', 'false');

      console.log('🔄 PersonService: Buscando sin populate:', params.toString());

      const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Person>>>(
        `${PERSON_ENDPOINTS.PEOPLE}?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Datos obtenidos sin populate');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener personas');
    } catch (error) {
      console.error('❌ PersonService: Falló método sin populate:', error);
      
      // Último fallback: retornar estructura vacía pero válida
      console.warn('🆘 PersonService: Usando fallback de estructura vacía');
      return {
        data: [],
        pagination: {
          total: 0,
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: 0
        }
      };
    }
  }

  /**
   * Obtener persona por ID
   */
  async getPersonById(id: string): Promise<Person> {
    try {
      console.log('🔍 PersonService: Buscando persona por ID:', id);

      const response = await axiosInstance.get<ApiResponse<Person>>(
        PERSON_ENDPOINTS.PERSON_BY_ID(id)
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Persona encontrada:', response.data.data._id);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener persona');
    } catch (error: any) {
      console.error('❌ PersonService: Error al obtener persona por ID:', {
        id,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Obtener persona por número de documento
   */
  async getPersonByDocument(documentNumber: string): Promise<Person> {
    try {
      console.log('🔍 PersonService: Buscando persona por documento:', documentNumber);

      const response = await axiosInstance.get<ApiResponse<Person>>(
        PERSON_ENDPOINTS.PERSON_BY_DOCUMENT(documentNumber)
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Persona encontrada por documento');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener persona');
    } catch (error: any) {
      console.error('❌ PersonService: Error al obtener persona por documento:', {
        documentNumber,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Actualizar persona
   */
  async updatePerson(id: string, personData: UpdatePersonRequest): Promise<Person> {
    try {
      console.log('🔄 PersonService: Actualizando persona:', id);

      const response = await axiosInstance.put<ApiResponse<Person>>(
        PERSON_ENDPOINTS.PERSON_BY_ID(id),
        personData
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Persona actualizada exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al actualizar persona');
    } catch (error: any) {
      console.error('❌ PersonService: Error al actualizar persona:', {
        id,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Activar persona
   */
  async activatePerson(id: string): Promise<Person> {
    try {
      console.log('🟢 PersonService: Activando persona:', id);

      const response = await axiosInstance.put<ApiResponse<Person>>(
        PERSON_ENDPOINTS.PERSON_ACTIVATE(id)
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Persona activada exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al activar persona');
    } catch (error: any) {
      console.error('❌ PersonService: Error al activar persona:', {
        id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Desactivar persona
   */
  async deactivatePerson(id: string): Promise<Person> {
    try {
      console.log('🔴 PersonService: Desactivando persona:', id);

      const response = await axiosInstance.put<ApiResponse<Person>>(
        PERSON_ENDPOINTS.PERSON_DEACTIVATE(id)
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Persona desactivada exitosamente');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al desactivar persona');
    } catch (error: any) {
      console.error('❌ PersonService: Error al desactivar persona:', {
        id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtener estadísticas de personas
   */
  async getPeopleStats(): Promise<{
    total: number;
    students: number;
    teachers: number;
    byGrade: Array<{ grade: string; count: number }>;
  }> {
    try {
      console.log('📊 PersonService: Obteniendo estadísticas de personas');

      const response = await axiosInstance.get<ApiResponse<any>>(
        PERSON_ENDPOINTS.PERSON_STATS
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Estadísticas obtenidas');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener estadísticas');
    } catch (error: any) {
      console.error('❌ PersonService: Error al obtener estadísticas:', error.message);
      throw error;
    }
  }

  /**
   * Obtener tipos de persona
   */
  async getPersonTypes(): Promise<PersonType[]> {
    try {
      console.log('📋 PersonService: Obteniendo tipos de persona');

      const response = await axiosInstance.get<ApiResponse<PersonType[]>>(
        PERSON_ENDPOINTS.PERSON_TYPES
      );

      if (response.data.success && response.data.data) {
        console.log('✅ PersonService: Tipos de persona obtenidos');
        return response.data.data;
      }

      throw new Error(response.data.message || 'Error al obtener tipos de persona');
    } catch (error: any) {
      console.error('❌ PersonService: Error al obtener tipos de persona:', error.message);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const personService = new PersonService();