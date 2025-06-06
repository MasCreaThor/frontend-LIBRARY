// src/hooks/useGoogleBooks.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  GoogleBooksService,
  type GoogleBooksResponseDto,
  type GoogleBooksVolumeDto,
  type GoogleBooksStatusDto,
  type EnrichedSearchDto
} from '@/services/googleBooks.service';
import { useState, useCallback } from 'react';

// Query keys para React Query
export const GOOGLE_BOOKS_QUERY_KEYS = {
  search: (query: string, maxResults: number) => ['google-books', 'search', query, maxResults] as const,
  byISBN: (isbn: string) => ['google-books', 'isbn', isbn] as const,
  byTitle: (title: string, maxResults: number) => ['google-books', 'title', title, maxResults] as const,
  byAuthor: (author: string, maxResults: number) => ['google-books', 'author', author, maxResults] as const,
  volume: (volumeId: string) => ['google-books', 'volume', volumeId] as const,
  enriched: (criteria: EnrichedSearchDto) => ['google-books', 'enriched', criteria] as const,
  status: ['google-books', 'status'] as const,
} as const;

/**
 * Hook para búsqueda general en Google Books
 */
export function useGoogleBooksSearch(
  query: string,
  maxResults = 10,
  enabled = true,
  options?: Omit<UseQueryOptions<GoogleBooksResponseDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.search(query, maxResults),
    queryFn: () => GoogleBooksService.searchBooks(query, maxResults),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

/**
 * Hook para búsqueda por ISBN
 */
export function useGoogleBooksByISBN(
  isbn: string,
  enabled = true,
  options?: Omit<UseQueryOptions<GoogleBooksVolumeDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.byISBN(isbn),
    queryFn: () => GoogleBooksService.searchByISBN(isbn),
    enabled: enabled && isbn.trim().length >= 10,
    staleTime: 30 * 60 * 1000, // 30 minutos - ISBN searches are more stable
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 2,
    ...options,
  });
}

/**
 * Hook para búsqueda por título
 */
export function useGoogleBooksByTitle(
  title: string,
  maxResults = 10,
  enabled = true,
  options?: Omit<UseQueryOptions<GoogleBooksResponseDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.byTitle(title, maxResults),
    queryFn: () => GoogleBooksService.searchByTitle(title, maxResults),
    enabled: enabled && title.trim().length >= 3,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para búsqueda por autor
 */
export function useGoogleBooksByAuthor(
  author: string,
  maxResults = 10,
  enabled = true,
  options?: Omit<UseQueryOptions<GoogleBooksResponseDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.byAuthor(author, maxResults),
    queryFn: () => GoogleBooksService.searchByAuthor(author, maxResults),
    enabled: enabled && author.trim().length >= 2,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para obtener detalles de un volumen
 */
export function useGoogleBooksVolume(
  volumeId: string,
  enabled = true,
  options?: Omit<UseQueryOptions<GoogleBooksVolumeDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.volume(volumeId),
    queryFn: () => GoogleBooksService.getVolumeDetails(volumeId),
    enabled: enabled && !!volumeId,
    staleTime: 60 * 60 * 1000, // 1 hora - volume details are stable
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    retry: 2,
    ...options,
  });
}

/**
 * Hook para búsqueda enriquecida
 */
export function useGoogleBooksEnrichedSearch(
  criteria: EnrichedSearchDto,
  enabled = true,
  options?: Omit<UseQueryOptions<GoogleBooksResponseDto>, 'queryKey' | 'queryFn'>
) {
  const hasValidCriteria = Boolean(
    criteria.title?.trim() || 
    criteria.author?.trim() || 
    criteria.isbn?.trim()
  );

  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.enriched(criteria),
    queryFn: () => GoogleBooksService.enrichedSearch(criteria),
    enabled: enabled && hasValidCriteria,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    ...options,
  });
}

/**
 * Hook para verificar estado de la API
 */
export function useGoogleBooksStatus(
  options?: Omit<UseQueryOptions<GoogleBooksStatusDto>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: GOOGLE_BOOKS_QUERY_KEYS.status,
    queryFn: GoogleBooksService.getApiStatus,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
    refetchInterval: 10 * 60 * 1000, // Refetch cada 10 minutos
    refetchIntervalInBackground: false,
    ...options,
  });
}

/**
 * Hook personalizado para manejo avanzado de búsquedas en Google Books
 */
export function useGoogleBooksAdvanced() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estado de la API
  const { data: apiStatus } = useGoogleBooksStatus();

  const addToSearchHistory = useCallback((query: string) => {
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)];
      return newHistory.slice(0, 10); // Mantener solo los últimos 10
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const isApiAvailable = apiStatus?.available ?? true;
  const quotaRemaining = apiStatus?.quota?.remaining ?? 1000;
  const quotaWarning = quotaRemaining < 100;

  return {
    // Estado de la búsqueda
    isSearching,
    setIsSearching,
    
    // Historial de búsquedas
    searchHistory,
    addToSearchHistory,
    clearSearchHistory,
    
    // Estado de la API
    isApiAvailable,
    quotaRemaining,
    quotaWarning,
    apiStatus,
    
    // Métodos de utilidad
    extractISBN: GoogleBooksService.extractISBN,
    formatTitle: GoogleBooksService.formatBookTitle,
    extractCategories: GoogleBooksService.extractRelevantCategories,
    checkAppropriate: GoogleBooksService.isSchoolAppropriate,
    getBestImage: GoogleBooksService.getBestImageUrl,
    buildQuery: GoogleBooksService.buildOptimizedQuery,
    parseDate: GoogleBooksService.parsePublicationDate,
    validateVolume: GoogleBooksService.validateAndCleanVolume,
  };
}

/**
 * Hook para búsqueda inteligente con múltiples estrategias
 */
export function useSmartGoogleBooksSearch() {
  const [currentStrategy, setCurrentStrategy] = useState<'general' | 'title' | 'author' | 'isbn'>('general');
  const [results, setResults] = useState<GoogleBooksVolumeDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchWithFallback = useCallback(async (criteria: {
    query?: string;
    title?: string;
    author?: string;
    isbn?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      let searchResults: GoogleBooksResponseDto | null = null;

      // Estrategia 1: Búsqueda por ISBN si está disponible
      if (criteria.isbn) {
        setCurrentStrategy('isbn');
        try {
          const volume = await GoogleBooksService.searchByISBN(criteria.isbn);
          setResults([volume]);
          return [volume];
        } catch (isbnError) {
          console.warn('ISBN search failed, trying other methods');
        }
      }

      // Estrategia 2: Búsqueda enriquecida
      if (criteria.title || criteria.author) {
        try {
          searchResults = await GoogleBooksService.enrichedSearch({
            title: criteria.title,
            author: criteria.author,
            maxResults: 20,
          });
        } catch (enrichedError) {
          console.warn('Enriched search failed, trying individual searches');
        }
      }

      // Estrategia 3: Búsqueda por título
      if (!searchResults && criteria.title) {
        setCurrentStrategy('title');
        try {
          searchResults = await GoogleBooksService.searchByTitle(criteria.title, 15);
        } catch (titleError) {
          console.warn('Title search failed');
        }
      }

      // Estrategia 4: Búsqueda por autor
      if (!searchResults && criteria.author) {
        setCurrentStrategy('author');
        try {
          searchResults = await GoogleBooksService.searchByAuthor(criteria.author, 15);
        } catch (authorError) {
          console.warn('Author search failed');
        }
      }

      // Estrategia 5: Búsqueda general
      if (!searchResults && criteria.query) {
        setCurrentStrategy('general');
        searchResults = await GoogleBooksService.searchBooks(criteria.query, 20);
      }

      if (searchResults?.items) {
        // Limpiar y validar resultados
        const cleanedResults = searchResults.items
          .map(GoogleBooksService.validateAndCleanVolume)
          .filter(volume => {
            // Filtrar resultados apropiados para biblioteca escolar
            const appropriatenessCheck = GoogleBooksService.isSchoolAppropriate(volume);
            return appropriatenessCheck.appropriate;
          });

        setResults(cleanedResults);
        return cleanedResults;
      } else {
        setResults([]);
        return [];
      }
    } catch (error: any) {
      console.error('Smart search failed:', error);
      setError(error.message || 'Error en la búsqueda');
      setResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setCurrentStrategy('general');
  }, []);

  return {
    // Estado
    results,
    isLoading,
    error,
    currentStrategy,
    
    // Métodos
    searchWithFallback,
    reset,
    
    // Utilidades
    hasResults: results.length > 0,
    resultCount: results.length,
  };
}

/**
 * Hook para manejo de selección de libros de Google Books
 */
export function useGoogleBooksSelection() {
  const [selectedVolume, setSelectedVolume] = useState<GoogleBooksVolumeDto | null>(null);
  const [selectionHistory, setSelectionHistory] = useState<GoogleBooksVolumeDto[]>([]);

  const selectVolume = useCallback((volume: GoogleBooksVolumeDto) => {
    setSelectedVolume(volume);
    
    // Agregar al historial
    setSelectionHistory(prev => {
      const newHistory = [volume, ...prev.filter(v => v.id !== volume.id)];
      return newHistory.slice(0, 5); // Mantener solo los últimos 5
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedVolume(null);
  }, []);

  const clearHistory = useCallback(() => {
    setSelectionHistory([]);
  }, []);

  // Extraer datos útiles del volumen seleccionado
  const extractedData = selectedVolume ? {
    title: GoogleBooksService.formatBookTitle(selectedVolume.title),
    authors: selectedVolume.authors || [],
    publisher: selectedVolume.publisher || '',
    isbn: GoogleBooksService.extractISBN(selectedVolume.industryIdentifiers),
    categories: GoogleBooksService.extractRelevantCategories(selectedVolume.categories),
    description: selectedVolume.description || '',
    pageCount: selectedVolume.pageCount || 0,
    publishedDate: GoogleBooksService.parsePublicationDate(selectedVolume.publishedDate),
    imageUrl: GoogleBooksService.getBestImageUrl(selectedVolume.imageLinks),
    googleBooksId: selectedVolume.id,
    appropriatenessCheck: GoogleBooksService.isSchoolAppropriate(selectedVolume),
  } : null;

  return {
    // Estado
    selectedVolume,
    selectionHistory,
    extractedData,
    
    // Métodos
    selectVolume,
    clearSelection,
    clearHistory,
    
    // Utilidades
    hasSelection: !!selectedVolume,
    isAppropriate: extractedData?.appropriatenessCheck.appropriate ?? false,
  };
}