// src/services/googleBooks.service.ts
import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';

const GOOGLE_BOOKS_ENDPOINTS = {
  SEARCH: '/google-books/search',
  BY_ISBN: (isbn: string) => `/google-books/isbn/${isbn}`,
  BY_TITLE: '/google-books/title',
  BY_AUTHOR: '/google-books/author',
  VOLUME: (volumeId: string) => `/google-books/volume/${volumeId}`,
  ENRICHED: '/google-books/enriched',
  STATUS: '/google-books/status',
} as const;

// DTOs para Google Books
export interface GoogleBooksSearchDto {
  query: string;
  maxResults?: number;
}

export interface GoogleBooksVolumeDto {
  id: string;
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  categories?: string[];
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  pageCount?: number;
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
}

export interface GoogleBooksResponseDto {
  kind: string;
  totalItems: number;
  items: GoogleBooksVolumeDto[];
}

export interface GoogleBooksStatusDto {
  available: boolean;
  message: string;
  quota: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface EnrichedSearchDto {
  title?: string;
  author?: string;
  isbn?: string;
  maxResults?: number;
}

export class GoogleBooksService {
  /**
   * Búsqueda general en Google Books
   */
  static async searchBooks(query: string, maxResults = 10): Promise<GoogleBooksResponseDto> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('maxResults', maxResults.toString());

    const response = await axiosInstance.get<ApiResponse<GoogleBooksResponseDto>>(
      `${GOOGLE_BOOKS_ENDPOINTS.SEARCH}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al buscar en Google Books');
  }

  /**
   * Búsqueda por ISBN
   */
  static async searchByISBN(isbn: string): Promise<GoogleBooksVolumeDto> {
    const response = await axiosInstance.get<ApiResponse<GoogleBooksVolumeDto>>(
      GOOGLE_BOOKS_ENDPOINTS.BY_ISBN(isbn)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al buscar por ISBN en Google Books');
  }

  /**
   * Búsqueda por título
   */
  static async searchByTitle(title: string, maxResults = 10): Promise<GoogleBooksResponseDto> {
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('maxResults', maxResults.toString());

    const response = await axiosInstance.get<ApiResponse<GoogleBooksResponseDto>>(
      `${GOOGLE_BOOKS_ENDPOINTS.BY_TITLE}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al buscar por título en Google Books');
  }

  /**
   * Búsqueda por autor
   */
  static async searchByAuthor(author: string, maxResults = 10): Promise<GoogleBooksResponseDto> {
    const params = new URLSearchParams();
    params.append('name', author);
    params.append('maxResults', maxResults.toString());

    const response = await axiosInstance.get<ApiResponse<GoogleBooksResponseDto>>(
      `${GOOGLE_BOOKS_ENDPOINTS.BY_AUTHOR}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al buscar por autor en Google Books');
  }

  /**
   * Obtener detalles de un volumen específico
   */
  static async getVolumeDetails(volumeId: string): Promise<GoogleBooksVolumeDto> {
    const response = await axiosInstance.get<ApiResponse<GoogleBooksVolumeDto>>(
      GOOGLE_BOOKS_ENDPOINTS.VOLUME(volumeId)
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al obtener detalles del volumen');
  }

  /**
   * Búsqueda enriquecida con múltiples criterios
   */
  static async enrichedSearch(criteria: EnrichedSearchDto): Promise<GoogleBooksResponseDto> {
    const params = new URLSearchParams();
    
    if (criteria.title) params.append('title', criteria.title);
    if (criteria.author) params.append('author', criteria.author);
    if (criteria.isbn) params.append('isbn', criteria.isbn);
    if (criteria.maxResults) params.append('maxResults', criteria.maxResults.toString());

    const response = await axiosInstance.get<ApiResponse<GoogleBooksResponseDto>>(
      `${GOOGLE_BOOKS_ENDPOINTS.ENRICHED}?${params.toString()}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error en búsqueda enriquecida');
  }

  /**
   * Verificar estado de la API de Google Books
   */
  static async getApiStatus(): Promise<GoogleBooksStatusDto> {
    const response = await axiosInstance.get<ApiResponse<GoogleBooksStatusDto>>(
      GOOGLE_BOOKS_ENDPOINTS.STATUS
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Error al verificar estado de la API');
  }

  /**
   * Extraer ISBN de identifiers
   */
  static extractISBN(identifiers?: Array<{ type: string; identifier: string }>): string | null {
    if (!identifiers) return null;

    // Buscar ISBN-13 primero, luego ISBN-10
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    if (isbn13) return isbn13.identifier;

    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    if (isbn10) return isbn10.identifier;

    return null;
  }

  /**
   * Formatear título de libro
   */
  static formatBookTitle(title: string): string {
    // Remover caracteres especiales y formatear
    return title
      .replace(/[:\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extraer categorías relevantes
   */
  static extractRelevantCategories(categories?: string[]): string[] {
    if (!categories) return [];

    // Filtrar categorías muy generales o irrelevantes
    const irrelevantCategories = [
      'Fiction',
      'General',
      'Juvenile Fiction',
      'Juvenile Nonfiction',
      'Study Aids',
      'Foreign Language Study',
    ];

    return categories
      .filter(cat => !irrelevantCategories.some(irrelevant => 
        cat.toLowerCase().includes(irrelevant.toLowerCase())
      ))
      .slice(0, 3); // Máximo 3 categorías
  }

  /**
   * Verificar si un libro es adecuado para biblioteca escolar
   */
  static isSchoolAppropriate(volume: GoogleBooksVolumeDto): {
    appropriate: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let appropriate = true;

    // Verificar categorías problemáticas
    const problematicCategories = [
      'erotica',
      'adult',
      'mature',
      'explicit',
    ];

    if (volume.categories) {
      const hasProblematicCategory = volume.categories.some(cat =>
        problematicCategories.some(problematic =>
          cat.toLowerCase().includes(problematic)
        )
      );

      if (hasProblematicCategory) {
        appropriate = false;
        reasons.push('Contiene categorías no apropiadas para biblioteca escolar');
      }
    }

    // Verificar descripción
    if (volume.description) {
      const description = volume.description.toLowerCase();
      const problematicWords = ['adult', 'explicit', 'mature content'];
      
      const hasProblematicContent = problematicWords.some(word =>
        description.includes(word)
      );

      if (hasProblematicContent) {
        appropriate = false;
        reasons.push('La descripción contiene contenido no apropiado');
      }
    }

    // Si no hay problemas, es apropiado
    if (appropriate) {
      reasons.push('Contenido apropiado para biblioteca escolar');
    }

    return { appropriate, reasons };
  }

  /**
   * Obtener imagen de mejor calidad disponible
   */
  static getBestImageUrl(imageLinks?: GoogleBooksVolumeDto['imageLinks']): string | null {
    if (!imageLinks) return null;

    // Preferir imágenes de mayor calidad
    return (
      imageLinks.large ||
      imageLinks.medium ||
      imageLinks.small ||
      imageLinks.thumbnail ||
      null
    );
  }

  /**
   * Construir query de búsqueda optimizada
   */
  static buildOptimizedQuery(criteria: {
    title?: string;
    author?: string;
    isbn?: string;
  }): string {
    const parts: string[] = [];

    if (criteria.isbn) {
      // ISBN tiene prioridad
      parts.push(`isbn:${criteria.isbn}`);
    }

    if (criteria.title) {
      // Limpiar título para búsqueda
      const cleanTitle = criteria.title
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      parts.push(`intitle:${cleanTitle}`);
    }

    if (criteria.author) {
      // Limpiar nombre del autor
      const cleanAuthor = criteria.author
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      parts.push(`inauthor:${cleanAuthor}`);
    }

    return parts.join(' ') || criteria.title || criteria.author || '';
  }

  /**
   * Parsear fecha de publicación
   */
  static parsePublicationDate(publishedDate?: string): Date | null {
    if (!publishedDate) return null;

    try {
      // Google Books puede devolver fechas en diferentes formatos
      if (publishedDate.match(/^\d{4}$/)) {
        // Solo año: "2020"
        return new Date(parseInt(publishedDate), 0, 1);
      }
      
      if (publishedDate.match(/^\d{4}-\d{2}$/)) {
        // Año y mes: "2020-03"
        const [year, month] = publishedDate.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      // Fecha completa: "2020-03-15"
      return new Date(publishedDate);
    } catch (error) {
      console.warn('Error parsing publication date:', publishedDate, error);
      return null;
    }
  }

  /**
   * Validar y limpiar datos de volumen
   */
  static validateAndCleanVolume(volume: GoogleBooksVolumeDto): GoogleBooksVolumeDto {
    return {
      ...volume,
      title: this.formatBookTitle(volume.title),
      authors: volume.authors?.filter(author => author.trim() !== '') || [],
      categories: this.extractRelevantCategories(volume.categories),
      description: volume.description?.substring(0, 1000) || undefined, // Limitar descripción
      pageCount: volume.pageCount && volume.pageCount > 0 ? volume.pageCount : undefined,
    };
  }
}