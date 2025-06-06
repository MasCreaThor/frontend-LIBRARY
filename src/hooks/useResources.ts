// src/hooks/useResources.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { 
  ResourceService, 
  type CreateResourceDto, 
  type UpdateResourceDto, 
  type ResourceFromGoogleBooksDto,
  type ResourceSearchDto,
  type ResourceStats,
  type Author,
  type Publisher
} from '@/services/resource.service';
import type { 
  Resource, 
  ResourceType, 
  Category, 
  Location, 
  ResourceState,
  PaginatedResponse
} from '@/types/api.types';
import toast from 'react-hot-toast';

// Query keys para React Query
export const RESOURCES_QUERY_KEYS = {
  resources: ['resources'] as const,
  resourcesList: (filters: ResourceSearchDto) => ['resources', 'list', filters] as const,
  resource: (id: string) => ['resources', 'detail', id] as const,
  resourceByISBN: (isbn: string) => ['resources', 'isbn', isbn] as const,
  resourceTypes: ['resources', 'types'] as const,
  categories: ['resources', 'categories'] as const,
  locations: ['resources', 'locations'] as const,
  resourceStates: ['resources', 'states'] as const,
  authors: ['resources', 'authors'] as const,
  authorsSearch: (query: string) => ['resources', 'authors', 'search', query] as const,
  publishers: ['resources', 'publishers'] as const,
  resourceStats: ['resources', 'stats'] as const,
} as const;

/**
 * Hook para obtener lista de recursos con filtros
 */
export function useResources(
  filters: ResourceSearchDto = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Resource>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.resourcesList(filters),
    queryFn: () => ResourceService.getResources(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
}

/**
 * Hook para obtener un recurso por ID
 */
export function useResource(
  id: string,
  options?: Omit<UseQueryOptions<Resource>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.resource(id),
    queryFn: () => ResourceService.getResourceById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  });
}

/**
 * Hook para buscar recurso por ISBN
 */
export function useResourceByISBN(
  isbn: string,
  enabled: boolean = true,
  options?: Omit<UseQueryOptions<Resource>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.resourceByISBN(isbn),
    queryFn: () => ResourceService.getResourceByISBN(isbn),
    enabled: enabled && !!isbn && isbn.length >= 10,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
    ...options,
  });
}

/**
 * Hook para obtener tipos de recursos
 */
export function useResourceTypes(
  options?: Omit<UseQueryOptions<ResourceType[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.resourceTypes,
    queryFn: ResourceService.getResourceTypes,
    staleTime: 30 * 60 * 1000, // 30 minutos - datos estables
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 2,
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Hook para obtener categorías
 */
export function useCategories(
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.categories,
    queryFn: ResourceService.getCategories,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener ubicaciones
 */
export function useLocations(
  options?: Omit<UseQueryOptions<Location[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.locations,
    queryFn: ResourceService.getLocations,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener estados de recursos
 */
export function useResourceStates(
  options?: Omit<UseQueryOptions<ResourceState[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.resourceStates,
    queryFn: ResourceService.getResourceStates,
    staleTime: 30 * 60 * 1000, // 30 minutos - datos estables
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 2,
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Hook para buscar autores
 */
export function useAuthorsSearch(
  query: string,
  enabled: boolean = true,
  options?: Omit<UseQueryOptions<Author[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.authorsSearch(query),
    queryFn: () => ResourceService.searchAuthors(query),
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  });
}

/**
 * Hook para obtener estadísticas de recursos
 */
export function useResourceStats(
  options?: Omit<UseQueryOptions<ResourceStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: RESOURCES_QUERY_KEYS.resourceStats,
    queryFn: ResourceService.getResourceStats,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  });
}

/**
 * Hook para crear un nuevo recurso manual
 */
export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceDto) => ResourceService.createResource(data),
    onSuccess: (newResource) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resources });
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resourceStats });
      
      // Agregar a cache
      queryClient.setQueryData(
        RESOURCES_QUERY_KEYS.resource(newResource._id),
        newResource
      );

      toast.success(`"${newResource.title}" registrado exitosamente`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al registrar recurso';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para crear recurso desde Google Books
 */
export function useCreateResourceFromGoogleBooks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResourceFromGoogleBooksDto) => ResourceService.createResourceFromGoogleBooks(data),
    onSuccess: (newResource) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resources });
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resourceStats });
      
      // Agregar a cache
      queryClient.setQueryData(
        RESOURCES_QUERY_KEYS.resource(newResource._id),
        newResource
      );

      toast.success(`"${newResource.title}" registrado exitosamente desde Google Books`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al registrar recurso desde Google Books';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para actualizar un recurso
 */
export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceDto }) => 
      ResourceService.updateResource(id, data),
    onSuccess: (updatedResource) => {
      // Actualizar cache específico
      queryClient.setQueryData(
        RESOURCES_QUERY_KEYS.resource(updatedResource._id),
        updatedResource
      );

      // Invalidar listas para refrescar
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resources });
      
      toast.success(`"${updatedResource.title}" actualizado exitosamente`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al actualizar recurso';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para cambiar disponibilidad de recurso
 */
export function useUpdateResourceAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => 
      ResourceService.updateAvailability(id, available),
    onSuccess: (updatedResource) => {
      // Actualizar cache
      queryClient.setQueryData(
        RESOURCES_QUERY_KEYS.resource(updatedResource._id),
        updatedResource
      );

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resources });
      
      const status = updatedResource.available ? 'disponible' : 'no disponible';
      toast.success(`"${updatedResource.title}" marcado como ${status}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al cambiar disponibilidad';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para eliminar un recurso
 */
export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ResourceService.deleteResource(id),
    onSuccess: (_, deletedId) => {
      // Remover de cache
      queryClient.removeQueries({ queryKey: RESOURCES_QUERY_KEYS.resource(deletedId) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resources });
      queryClient.invalidateQueries({ queryKey: RESOURCES_QUERY_KEYS.resourceStats });
      
      toast.success('Recurso eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al eliminar recurso';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para crear autores en lote
 */
export function useCreateAuthors() {
  return useMutation({
    mutationFn: (names: string[]) => ResourceService.createAuthors(names),
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear autores';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para buscar o crear editorial
 */
export function useFindOrCreatePublisher() {
  return useMutation({
    mutationFn: (name: string) => ResourceService.findOrCreatePublisher(name),
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al buscar/crear editorial';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

/**
 * Hook para búsqueda simple de recursos
 */
export function useSearchResources(query: string, limit: number = 10) {
  return useQuery({
    queryKey: ['resources', 'search', query, limit],
    queryFn: () => ResourceService.searchResources(query, limit),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para validar ISBN único
 */
export function useValidateISBN(isbn: string, excludeId?: string) {
  return useQuery({
    queryKey: ['resources', 'validate-isbn', isbn, excludeId],
    queryFn: () => ResourceService.validateISBN(isbn, excludeId),
    enabled: !!isbn && isbn.length >= 10,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para obtener datos del formulario (tipos, categorías, ubicaciones, estados)
 */
export function useResourceFormData() {
  const resourceTypesQuery = useResourceTypes();
  const categoriesQuery = useCategories();
  const locationsQuery = useLocations();
  const resourceStatesQuery = useResourceStates();

  return {
    resourceTypes: resourceTypesQuery,
    categories: categoriesQuery,
    locations: locationsQuery,
    resourceStates: resourceStatesQuery,
    
    // Estados combinados
    isLoading: resourceTypesQuery.isLoading || categoriesQuery.isLoading || 
               locationsQuery.isLoading || resourceStatesQuery.isLoading,
    isError: resourceTypesQuery.isError || categoriesQuery.isError || 
             locationsQuery.isError || resourceStatesQuery.isError,
    error: resourceTypesQuery.error || categoriesQuery.error || 
           locationsQuery.error || resourceStatesQuery.error,
    
    // Datos combinados
    data: {
      resourceTypes: resourceTypesQuery.data || [],
      categories: categoriesQuery.data || [],
      locations: locationsQuery.data || [],
      resourceStates: resourceStatesQuery.data || [],
    },
    
    // Función para refrescar todos
    refetchAll: () => {
      resourceTypesQuery.refetch();
      categoriesQuery.refetch();
      locationsQuery.refetch();
      resourceStatesQuery.refetch();
    },
  };
}