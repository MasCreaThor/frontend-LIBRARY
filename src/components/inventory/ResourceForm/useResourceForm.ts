// src/components/inventory/ResourceForm/useResourceForm.ts
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ResourceValidationSchemaFactory,
  ResourceBusinessRules,
  ResourceDataTransformer,
  type DynamicResourceFormData 
} from '@/lib/validation/resourceValidation';
import { ResourceTypeManager } from '@/lib/resourceType';
import { TextUtils } from '@/utils';
import { 
  useResourceFormData, 
  useValidateISBN,
  useAuthorsSearch,
  useFindOrCreatePublisher,
  useCreateAuthors
} from '@/hooks/useResources';
import type { Resource, CreateResourceDto, UpdateResourceDto } from '@/types/api.types';
import type { GoogleBooksVolumeDto } from '@/services/googleBooks.service';

export interface UseResourceFormOptions {
  resource?: Resource;
  isEdit?: boolean;
  googleBooksData?: GoogleBooksVolumeDto;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export interface UseResourceFormReturn {
  // Form state
  form: ReturnType<typeof useForm<DynamicResourceFormData>>;
  
  // Resource type state
  selectedResourceType: any;
  resourceTypeConfig: any;
  isBook: boolean;
  isGame: boolean;
  isMap: boolean;
  isBible: boolean;
  
  // Form data
  formData: {
    resourceTypes: any[];
    categories: any[];
    locations: any[];
    resourceStates: any[];
  };
  
  // ISBN validation state
  isbnValidation: {
    isValidating: boolean;
    hasConflict: boolean;
    existingResource: Resource | null;
    showValidation: boolean;
  };
  
  // Authors state
  authorsState: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: any[];
    isSearching: boolean;
    selectedAuthors: any[];
    addAuthor: (author: any) => void;
    removeAuthor: (authorId: string) => void;
    createNewAuthor: (name: string) => void;
  };
  
  // Publisher state
  publisherState: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedPublisher: any;
    setSelectedPublisher: (publisher: any) => void;
    createNewPublisher: (name: string) => void;
  };
  
  // Loading states
  isLoading: boolean;
  
  // Handlers
  handleSubmit: () => void;
  resetForm: () => void;
  
  // Validation
  businessRulesErrors: string[];
  
  // Google Books integration
  isFromGoogleBooks: boolean;
  googleBooksInfo: any;
}

/**
 * Custom hook que maneja toda la lógica del formulario de recursos
 */
export function useResourceForm({
  resource,
  isEdit = false,
  googleBooksData,
  onSubmit,
  onCancel,
}: UseResourceFormOptions): UseResourceFormReturn {
  
  // Estados locales
  const [selectedResourceTypeId, setSelectedResourceTypeId] = useState<string>(
    resource?.typeId || ''
  );
  const [isbnToValidate, setIsbnToValidate] = useState<string>('');
  const [showIsbnValidation, setShowIsbnValidation] = useState(false);
  const [businessRulesErrors, setBusinessRulesErrors] = useState<string[]>([]);
  
  // Estados para autores
  const [authorsSearchQuery, setAuthorsSearchQuery] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<any[]>([]);
  
  // Estados para editorial
  const [publisherSearchQuery, setPublisherSearchQuery] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<any>(null);

  // Queries
  const formDataQuery = useResourceFormData();
  const { 
    data: existingResource, 
    isLoading: isValidatingISBN,
  } = useValidateISBN(
    isbnToValidate,
    resource?._id,
    showIsbnValidation && isbnToValidate.length >= 10
  );
  
  const { data: authorsSearchResults = [], isLoading: isSearchingAuthors } = useAuthorsSearch(
    authorsSearchQuery,
    authorsSearchQuery.length >= 2
  );

  // Mutations
  const createAuthorsMutation = useCreateAuthors();
  const findOrCreatePublisherMutation = useFindOrCreatePublisher();

  // Determinar el tipo de recurso seleccionado
  const selectedResourceType = formDataQuery.data.resourceTypes.find(
    type => type._id === selectedResourceTypeId
  );
  
  const resourceTypeConfig = selectedResourceType 
    ? ResourceTypeManager.getConfig({ typeId: selectedResourceType._id, type: selectedResourceType })
    : null;

  const isBook = resourceTypeConfig?.requiresISBN && resourceTypeConfig?.requiresAuthors;
  const isGame = resourceTypeConfig?.label === 'Juego';
  const isMap = resourceTypeConfig?.label === 'Mapa';
  const isBible = resourceTypeConfig?.label === 'Biblia';

  // Configurar formulario con schema dinámico
  const resourceTypeName = selectedResourceType?.name || 'book';
  const form = useForm<DynamicResourceFormData>({
    resolver: zodResolver(ResourceValidationSchemaFactory.getSchema(resourceTypeName)),
    defaultValues: {
      title: resource?.title || googleBooksData?.title || '',
      typeId: resource?.typeId || '',
      categoryId: resource?.categoryId || '',
      stateId: resource?.stateId || '',
      locationId: resource?.locationId || '',
      volumes: resource?.volumes || ResourceTypeManager.getDefaultVolumes(resourceTypeName),
      notes: resource?.notes || '',
      isbn: resource?.isbn || '',
      authorIds: resource?.authorIds || [],
      publisherId: resource?.publisherId || '',
    },
    mode: 'onChange',
  });

  const { watch, setValue, reset, handleSubmit: handleFormSubmit } = form;

  // Observar cambios en campos críticos
  const watchedTypeId = watch('typeId');
  const watchedISBN = watch('isbn');

  // Efecto para manejar cambios en el tipo de recurso
  useEffect(() => {
    setSelectedResourceTypeId(watchedTypeId);
    
    // Limpiar campos específicos según el tipo
    if (selectedResourceType) {
      const config = ResourceTypeManager.getConfig({ 
        typeId: selectedResourceType._id, 
        type: selectedResourceType 
      });
      
      // Ajustar volúmenes por defecto
      setValue('volumes', config.defaultVolumes);
      
      // Limpiar ISBN si no es requerido
      if (!config.requiresISBN) {
        setValue('isbn', '');
      }
      
      // Limpiar autores si no son requeridos
      if (!config.requiresAuthors) {
        setValue('authorIds', []);
        setSelectedAuthors([]);
      }
    }

    // Revalidar reglas de negocio cuando cambia el tipo
    if (watchedTypeId) {
      validateBusinessRules();
    }
  }, [watchedTypeId, selectedResourceType, setValue]);

  // Efecto para manejar validación de ISBN
  useEffect(() => {
    const isbn = watchedISBN?.trim();
    if (isbn && isbn.length >= 10) {
      // Solo validar si es diferente al ISBN original (en caso de edición)
      if (!resource || isbn !== resource.isbn) {
        setIsbnToValidate(isbn);
        setShowIsbnValidation(true);
      } else {
        setShowIsbnValidation(false);
      }
    } else {
      setShowIsbnValidation(false);
    }
  }, [watchedISBN, resource]);

  // Efecto para cargar datos de Google Books
  useEffect(() => {
    if (googleBooksData && !isEdit) {
      setValue('title', googleBooksData.title);
      
      // Configurar autores si están disponibles
      if (googleBooksData.authors && googleBooksData.authors.length > 0) {
        // Crear autores automáticamente
        createAuthorsMutation.mutate(googleBooksData.authors, {
          onSuccess: (newAuthors) => {
            setSelectedAuthors(newAuthors);
            setValue('authorIds', newAuthors.map(author => author._id));
          },
        });
      }
      
      // Configurar editorial si está disponible
      if (googleBooksData.publisher) {
        findOrCreatePublisherMutation.mutate(googleBooksData.publisher, {
          onSuccess: (publisher) => {
            setSelectedPublisher(publisher);
            setValue('publisherId', publisher._id);
          },
        });
      }
      
      // Configurar ISBN si está disponible
      const isbn = extractISBNFromGoogleBooks(googleBooksData);
      if (isbn) {
        setValue('isbn', isbn);
      }
    }
  }, [googleBooksData, isEdit, setValue, createAuthorsMutation, findOrCreatePublisherMutation]);

  // Función auxiliar para extraer ISBN de Google Books
  const extractISBNFromGoogleBooks = (volumeData: GoogleBooksVolumeDto): string | null => {
    if (volumeData.industryIdentifiers) {
      const isbn13 = volumeData.industryIdentifiers.find(id => id.type === 'ISBN_13');
      if (isbn13) return isbn13.identifier;
      
      const isbn10 = volumeData.industryIdentifiers.find(id => id.type === 'ISBN_10');
      if (isbn10) return isbn10.identifier;
    }
    return null;
  };

  // Validar reglas de negocio
  const validateBusinessRules = useCallback(() => {
    const formData = form.getValues();
    const validation = ResourceBusinessRules.validateAllRules(formData, resourceTypeName);
    setBusinessRulesErrors(validation.errors);
  }, [form, resourceTypeName]);

  // Ejecutar validación de reglas
  useEffect(() => {
    const subscription = form.watch(() => {
      validateBusinessRules();
    });
    return () => subscription.unsubscribe();
  }, [form, validateBusinessRules]);

  // Handlers para autores
  const addAuthor = useCallback((author: any) => {
    const newAuthors = [...selectedAuthors, author];
    setSelectedAuthors(newAuthors);
    setValue('authorIds', newAuthors.map(a => a._id));
    setAuthorsSearchQuery('');
  }, [selectedAuthors, setValue]);

  const removeAuthor = useCallback((authorId: string) => {
    const newAuthors = selectedAuthors.filter(a => a._id !== authorId);
    setSelectedAuthors(newAuthors);
    setValue('authorIds', newAuthors.map(a => a._id));
  }, [selectedAuthors, setValue]);

  const createNewAuthor = useCallback((name: string) => {
    createAuthorsMutation.mutate([name], {
      onSuccess: (newAuthors) => {
        if (newAuthors.length > 0) {
          addAuthor(newAuthors[0]);
        }
      },
    });
  }, [addAuthor, createAuthorsMutation]);

  // Handlers para editorial
  const createNewPublisher = useCallback((name: string) => {
    findOrCreatePublisherMutation.mutate(name, {
      onSuccess: (publisher) => {
        setSelectedPublisher(publisher);
        setValue('publisherId', publisher._id);
        setPublisherSearchQuery('');
      },
    });
  }, [findOrCreatePublisherMutation, setValue]);

  // Handler para envío del formulario
  const handleSubmit = handleFormSubmit((data: DynamicResourceFormData) => {
    // Validar reglas de negocio antes del envío
    const businessValidation = ResourceBusinessRules.validateAllRules(data, resourceTypeName);
    if (!businessValidation.isValid) {
      setBusinessRulesErrors(businessValidation.errors);
      return;
    }

    // Limpiar y formatear datos antes de enviar
    const cleanData = ResourceDataTransformer.cleanFormData(data, resourceTypeName);

    onSubmit(cleanData);
  });

  // Reset del formulario
  const resetForm = useCallback(() => {
    reset();
    setBusinessRulesErrors([]);
    setSelectedAuthors([]);
    setSelectedPublisher(null);
    setShowIsbnValidation(false);
    setIsbnToValidate('');
    setAuthorsSearchQuery('');
    setPublisherSearchQuery('');
  }, [reset]);

  // Verificar si hay conflicto de ISBN
  const hasIsbnConflict = existingResource && (!resource || existingResource._id !== resource._id);

  return {
    // Form state
    form,
    
    // Resource type state
    selectedResourceType,
    resourceTypeConfig,
    isBook,
    isGame,
    isMap,
    isBible,
    
    // Form data
    formData: formDataQuery.data,
    
    // ISBN validation state
    isbnValidation: {
      isValidating: isValidatingISBN,
      hasConflict: !!hasIsbnConflict,
      existingResource: existingResource || null,
      showValidation: showIsbnValidation,
    },
    
    // Authors state
    authorsState: {
      searchQuery: authorsSearchQuery,
      setSearchQuery: setAuthorsSearchQuery,
      searchResults: authorsSearchResults,
      isSearching: isSearchingAuthors,
      selectedAuthors,
      addAuthor,
      removeAuthor,
      createNewAuthor,
    },
    
    // Publisher state
    publisherState: {
      searchQuery: publisherSearchQuery,
      setSearchQuery: setPublisherSearchQuery,
      selectedPublisher,
      setSelectedPublisher,
      createNewPublisher,
    },
    
    // Loading states
    isLoading: formDataQuery.isLoading,
    
    // Handlers
    handleSubmit,
    resetForm,
    
    // Validation
    businessRulesErrors,
    
    // Google Books integration
    isFromGoogleBooks: !!googleBooksData,
    googleBooksInfo: googleBooksData || null,
  };
}