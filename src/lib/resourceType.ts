// src/lib/resourceType.ts
import { FiBook, FiGamepad2, FiMap, FiBookOpen } from 'react-icons/fi';
import type { Resource, ResourceType, Category, Location, ResourceState } from '@/types/api.types';

export interface ResourceTypeConfig {
  label: string;
  color: string;
  icon: any;
  description: string;
  requiresISBN: boolean;
  requiresAuthors: boolean;
  allowsMultipleVolumes: boolean;
  defaultVolumes: number;
  placeholder: {
    title: string;
    notes: string;
  };
}

export interface ResourceDisplayInfo {
  title: string;
  typeLabel: string;
  formattedIdentifier: string;
  statusText: string;
  volumeText: string;
  locationText: string;
}

/**
 * Manager centralizado para toda la lógica relacionada con tipos de recursos
 * Consolida la lógica de diferentes tipos de recursos (libros, juegos, mapas, biblias)
 */
export class ResourceTypeManager {
  
  /**
   * Configuraciones base para tipos de recursos conocidos
   */
  private static readonly TYPE_CONFIGS: Record<string, ResourceTypeConfig> = {
    book: {
      label: 'Libro',
      color: 'blue',
      icon: FiBook,
      description: 'Libros de texto, literatura y referencia',
      requiresISBN: true,
      requiresAuthors: true,
      allowsMultipleVolumes: true,
      defaultVolumes: 1,
      placeholder: {
        title: 'Ej: Cien años de soledad',
        notes: 'Estado físico, observaciones adicionales...',
      },
    },
    game: {
      label: 'Juego',
      color: 'green',
      icon: FiGamepad2,
      description: 'Juegos educativos y didácticos',
      requiresISBN: false,
      requiresAuthors: false,
      allowsMultipleVolumes: false,
      defaultVolumes: 1,
      placeholder: {
        title: 'Ej: Monopoly Educativo',
        notes: 'Estado de las piezas, instrucciones...',
      },
    },
    map: {
      label: 'Mapa',
      color: 'orange',
      icon: FiMap,
      description: 'Mapas geográficos, políticos y temáticos',
      requiresISBN: false,
      requiresAuthors: false,
      allowsMultipleVolumes: false,
      defaultVolumes: 1,
      placeholder: {
        title: 'Ej: Mapa Político de Colombia',
        notes: 'Estado del material, escala...',
      },
    },
    bible: {
      label: 'Biblia',
      color: 'purple',
      icon: FiBookOpen,
      description: 'Biblias y textos religiosos',
      requiresISBN: true,
      requiresAuthors: false,
      allowsMultipleVolumes: true,
      defaultVolumes: 1,
      placeholder: {
        title: 'Ej: Biblia Reina Valera 1960',
        notes: 'Versión, año de publicación...',
      },
    },
  };

  /**
   * Configuración fallback para tipos desconocidos
   */
  private static readonly DEFAULT_CONFIG: ResourceTypeConfig = {
    label: 'Recurso',
    color: 'gray',
    icon: FiBook,
    description: 'Recurso de biblioteca',
    requiresISBN: false,
    requiresAuthors: false,
    allowsMultipleVolumes: true,
    defaultVolumes: 1,
    placeholder: {
      title: 'Nombre del recurso',
      notes: 'Observaciones adicionales...',
    },
  };

  /**
   * Obtiene la configuración completa para el tipo de recurso
   */
  static getConfig(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): ResourceTypeConfig {
    // 1. Si tiene type poblado, usarlo directamente
    if ('type' in resource && resource.type?.name) {
      const baseConfig = this.TYPE_CONFIGS[resource.type.name];
      if (baseConfig) {
        return {
          ...baseConfig,
          description: resource.type.description || baseConfig.description,
        };
      }
      
      // Si el nombre no coincide con los esperados, usar configuración custom
      return {
        ...this.DEFAULT_CONFIG,
        label: resource.type.description || 'Recurso Personalizado',
        description: resource.type.description || 'Tipo de recurso personalizado',
      };
    }

    // 2. Si no está poblado pero tenemos typeId y la lista de tipos
    if (resource.typeId && fallbackTypes) {
      const resourceType = fallbackTypes.find(type => type._id === resource.typeId);
      if (resourceType) {
        const baseConfig = this.TYPE_CONFIGS[resourceType.name];
        if (baseConfig) {
          return {
            ...baseConfig,
            description: resourceType.description || baseConfig.description,
          };
        }
        
        return {
          ...this.DEFAULT_CONFIG,
          label: resourceType.description || 'Recurso Personalizado',
          description: resourceType.description || 'Tipo de recurso personalizado',
        };
      }
    }

    // 3. Fallback final
    return this.DEFAULT_CONFIG;
  }

  /**
   * Determina si un recurso es un libro
   */
  static isBook(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): boolean {
    const config = this.getConfig(resource, fallbackTypes);
    return config.requiresISBN && config.requiresAuthors;
  }

  /**
   * Determina si un recurso es un juego
   */
  static isGame(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): boolean {
    const config = this.getConfig(resource, fallbackTypes);
    return config.label === 'Juego';
  }

  /**
   * Determina si un recurso es un mapa
   */
  static isMap(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): boolean {
    const config = this.getConfig(resource, fallbackTypes);
    return config.label === 'Mapa';
  }

  /**
   * Determina si un recurso es una biblia
   */
  static isBible(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): boolean {
    const config = this.getConfig(resource, fallbackTypes);
    return config.label === 'Biblia';
  }

  /**
   * Obtiene el identificador formateado (ISBN para libros, título para otros)
   */
  static getFormattedIdentifier(resource: Resource): string {
    if (resource.isbn) {
      // Formatear ISBN
      const isbn = resource.isbn.replace(/[-\s]/g, '');
      if (isbn.length === 13) {
        return `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 6)}-${isbn.slice(6, 12)}-${isbn.slice(12)}`;
      } else if (isbn.length === 10) {
        return `${isbn.slice(0, 1)}-${isbn.slice(1, 6)}-${isbn.slice(6, 9)}-${isbn.slice(9)}`;
      }
      return isbn;
    }
    
    return `ID: ${resource._id.slice(-8).toUpperCase()}`;
  }

  /**
   * Obtiene el texto de estado del recurso
   */
  static getStatusText(resource: Resource, fallbackStates?: ResourceState[]): {
    text: string;
    color: string;
  } {
    // Si tiene state poblado
    if (resource.state) {
      return {
        text: resource.state.description,
        color: this.getStateColor(resource.state.name),
      };
    }

    // Si no está poblado pero tenemos stateId y lista de estados
    if (resource.stateId && fallbackStates) {
      const state = fallbackStates.find(s => s._id === resource.stateId);
      if (state) {
        return {
          text: state.description,
          color: this.getStateColor(state.name),
        };
      }
    }

    return {
      text: 'Estado desconocido',
      color: 'gray',
    };
  }

  /**
   * Obtiene el color apropiado para un estado
   */
  private static getStateColor(stateName: string): string {
    const stateColors = {
      good: 'green',
      deteriorated: 'yellow',
      damaged: 'orange',
      lost: 'red',
    };
    
    return stateColors[stateName as keyof typeof stateColors] || 'gray';
  }

  /**
   * Obtiene el texto de volúmenes
   */
  static getVolumeText(resource: Resource): string {
    const volumes = resource.volumes || 1;
    if (volumes === 1) {
      return '1 unidad';
    }
    return `${volumes} volúmenes`;
  }

  /**
   * Obtiene el texto de ubicación
   */
  static getLocationText(resource: Resource, fallbackLocations?: Location[]): string {
    // Si tiene location poblado
    if (resource.location) {
      return resource.location.description || resource.location.name;
    }

    // Si no está poblado pero tenemos locationId y lista de ubicaciones
    if (resource.locationId && fallbackLocations) {
      const location = fallbackLocations.find(l => l._id === resource.locationId);
      if (location) {
        return location.description || location.name;
      }
    }

    return 'Ubicación no especificada';
  }

  /**
   * Obtiene información completa de display para un recurso
   */
  static getDisplayInfo(resource: Resource, fallbackData?: {
    types?: ResourceType[];
    states?: ResourceState[];
    locations?: Location[];
  }): ResourceDisplayInfo {
    const config = this.getConfig(resource, fallbackData?.types);
    const statusInfo = this.getStatusText(resource, fallbackData?.states);
    
    return {
      title: resource.title,
      typeLabel: config.label,
      formattedIdentifier: this.getFormattedIdentifier(resource),
      statusText: statusInfo.text,
      volumeText: this.getVolumeText(resource),
      locationText: this.getLocationText(resource, fallbackData?.locations),
    };
  }

  /**
   * Valida si los datos de un recurso son consistentes con su tipo
   */
  static validateResourceData(resource: Partial<Resource>, resourceType: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;

    // Validar ISBN si es requerido
    if (config.requiresISBN && !resource.isbn) {
      errors.push(`Los ${config.label.toLowerCase()}s requieren ISBN`);
    }

    // Validar ISBN si no es requerido pero está presente
    if (!config.requiresISBN && resource.isbn) {
      errors.push(`Los ${config.label.toLowerCase()}s no utilizan ISBN`);
    }

    // Validar autores si son requeridos
    if (config.requiresAuthors && (!resource.authorIds || resource.authorIds.length === 0)) {
      errors.push(`Los ${config.label.toLowerCase()}s requieren al menos un autor`);
    }

    // Validar volúmenes múltiples
    if (!config.allowsMultipleVolumes && resource.volumes && resource.volumes > 1) {
      errors.push(`Los ${config.label.toLowerCase()}s generalmente son de 1 unidad`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obtiene el ícono apropiado para el tipo de recurso
   */
  static getIcon(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): any {
    const config = this.getConfig(resource, fallbackTypes);
    return config.icon;
  }

  /**
   * Obtiene el color apropiado para el tipo de recurso
   */
  static getColor(resource: Resource | { typeId: string; type?: ResourceType }, fallbackTypes?: ResourceType[]): string {
    const config = this.getConfig(resource, fallbackTypes);
    return config.color;
  }

  /**
   * Obtiene el placeholder apropiado para el campo título
   */
  static getTitlePlaceholder(resourceType: string): string {
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;
    return config.placeholder.title;
  }

  /**
   * Obtiene el placeholder apropiado para el campo notas
   */
  static getNotesPlaceholder(resourceType: string): string {
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;
    return config.placeholder.notes;
  }

  /**
   * Verifica si dos recursos tienen el mismo tipo
   */
  static hasSameType(resource1: Resource, resource2: Resource, fallbackTypes?: ResourceType[]): boolean {
    const config1 = this.getConfig(resource1, fallbackTypes);
    const config2 = this.getConfig(resource2, fallbackTypes);
    return config1.label === config2.label;
  }

  /**
   * Obtiene sugerencias de categorías por tipo de recurso
   */
  static getSuggestedCategories(resourceType: string, allCategories: Category[]): Category[] {
    const suggestions = {
      book: ['Matemáticas', 'Ciencias Naturales', 'Lenguaje', 'Literatura', 'Enciclopedias'],
      game: ['Matemáticas', 'Ciencias Naturales', 'Educación Física'],
      map: ['Ciencias Sociales', 'Geografía'],
      bible: ['Educación Religiosa'],
    };

    const typesSuggestions = suggestions[resourceType as keyof typeof suggestions] || [];
    
    return allCategories.filter(category =>
      typesSuggestions.some(suggestion =>
        category.name.toLowerCase().includes(suggestion.toLowerCase())
      )
    );
  }

  /**
   * Formatea el título para display
   */
  static formatTitle(title: string, maxLength = 60): string {
    if (title.length <= maxLength) {
      return title;
    }
    
    return `${title.substring(0, maxLength - 3)}...`;
  }

  /**
   * Obtiene la configuración de un tipo por ID
   */
  static getConfigById(typeId: string, allTypes: ResourceType[]): ResourceTypeConfig {
    const resourceType = allTypes.find(type => type._id === typeId);
    if (resourceType) {
      return this.getConfig({ typeId, type: resourceType });
    }
    return this.DEFAULT_CONFIG;
  }

  /**
   * Verifica si un tipo de recurso permite ISBN
   */
  static allowsISBN(resourceType: string): boolean {
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;
    return config.requiresISBN;
  }

  /**
   * Verifica si un tipo de recurso requiere autores
   */
  static requiresAuthors(resourceType: string): boolean {
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;
    return config.requiresAuthors;
  }

  /**
   * Verifica si un tipo de recurso permite múltiples volúmenes
   */
  static allowsMultipleVolumes(resourceType: string): boolean {
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;
    return config.allowsMultipleVolumes;
  }

  /**
   * Obtiene el número de volúmenes por defecto para un tipo
   */
  static getDefaultVolumes(resourceType: string): number {
    const config = this.TYPE_CONFIGS[resourceType] || this.DEFAULT_CONFIG;
    return config.defaultVolumes;
  }
}