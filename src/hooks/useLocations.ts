// ==========================================
// src/hooks/useLocations.ts
// ==========================================
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { LocationService } from '@/services/location.service';
import type {
  Location,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationFilters,
} from '@/services/location.service';
import type { PaginatedResponse } from '@/types/api.types';
import toast from 'react-hot-toast';

export const LOCATION_QUERY_KEYS = {
  locations: ['locations'] as const,
  locationsList: (filters: LocationFilters) => ['locations', 'list', filters] as const,
  location: (id: string) => ['locations', 'detail', id] as const,
  locationStats: ['locations', 'stats'] as const,
} as const;

export function useLocations(
  filters: LocationFilters = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Location>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.locationsList(filters),
    queryFn: () => LocationService.getLocations(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    ...options,
  });
}

export function useLocation(
  id: string,
  options?: Omit<UseQueryOptions<Location>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.location(id),
    queryFn: () => LocationService.getLocationById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  });
}

export function useLocationStats(
  options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof LocationService.getLocationStats>>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: LOCATION_QUERY_KEYS.locationStats,
    queryFn: LocationService.getLocationStats,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    ...options,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLocationRequest) => LocationService.createLocation(data),
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.locations });
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.locationStats });
      queryClient.setQueryData(LOCATION_QUERY_KEYS.location(newLocation._id), newLocation);
      toast.success(`Ubicación "${newLocation.name}" creada exitosamente`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear ubicación';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationRequest }) => 
      LocationService.updateLocation(id, data),
    onSuccess: (updatedLocation) => {
      queryClient.setQueryData(LOCATION_QUERY_KEYS.location(updatedLocation._id), updatedLocation);
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.locations });
      toast.success(`Ubicación "${updatedLocation.name}" actualizada exitosamente`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al actualizar ubicación';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => LocationService.deleteLocation(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: LOCATION_QUERY_KEYS.location(deletedId) });
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.locations });
      queryClient.invalidateQueries({ queryKey: LOCATION_QUERY_KEYS.locationStats });
      toast.success('Ubicación eliminada exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al eliminar ubicación';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    },
  });
}
