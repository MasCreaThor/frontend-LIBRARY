// src/components/resources/ResourceSearch/ResourceSearch.tsx - VERSIÓN CORREGIDA
'use client';

import {
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Box,
  List,
  ListItem,
  Spinner,
  useColorModeValue,
  Badge,
  Image,
  Alert,
  AlertIcon,
  Icon,
  Button,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBook, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { Resource, ResourceFilters } from '@/types/resource.types';
import { ResourceService } from '@/services/resource.service';
import { useDebounce } from '@/hooks/useDebounce';

interface ResourceSearchProps {
  onSelect: (resource: Resource | null) => void;
  selectedResource?: Resource | null;
  placeholder?: string;
  isDisabled?: boolean;
  filterAvailable?: boolean;
  showOnlyAvailable?: boolean;
}

export function ResourceSearch({
  onSelect,
  selectedResource = null,
  placeholder = "Buscar recurso (mínimo 2 caracteres)...",
  isDisabled = false,
  filterAvailable = false,
  showOnlyAvailable = true, // Por defecto solo mostrar disponibles
}: ResourceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const errorBorderColor = useColorModeValue('red.300', 'red.500');

  // Inicializar con recurso seleccionado si existe
  useEffect(() => {
    if (selectedResource && !searchTerm) {
      setSearchTerm(selectedResource.title);
    }
  }, [selectedResource]);

  // Búsqueda de recursos con manejo de errores mejorado
  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      
      const filters: ResourceFilters = {
        search: debouncedSearchTerm,
        limit: 10,
      };
      
      // CORRECCIÓN: Aplicar filtro de disponibilidad correctamente
      if (filterAvailable || showOnlyAvailable) {
        filters.availability = 'available'; // Usar el parámetro correcto
      }

      console.log('🔍 ResourceSearch: Iniciando búsqueda:', { 
        term: debouncedSearchTerm, 
        filters 
      });

      // CORRECCIÓN: Usar el método estático correctamente y manejar PaginatedResponse
      ResourceService.getResources(filters)
        .then((response) => {
          console.log('✅ ResourceSearch: Resultados obtenidos:', {
            count: response.data?.length || 0,
            total: response.pagination?.total || 0,
            success: true
          });
          
          // CORRECCIÓN: La respuesta es PaginatedResponse<Resource>, extraer data
          setResults(response.data || []);
          setIsOpen(true);
          setSelectedIndex(-1);
          setError(null);
        })
        .catch((error) => {
          console.error('❌ ResourceSearch: Error en búsqueda:', error);
          setResults([]);
          setIsOpen(false);
          
          // Determinar tipo de error y mensaje apropiado
          let errorMessage = 'Error al buscar recursos.';
          
          if (!error.response) {
            errorMessage = 'Error de conexión. Verifica que el servidor esté disponible.';
          } else if (error.response.status === 500) {
            errorMessage = 'Error interno del servidor. Contacta al administrador.';
          } else if (error.response.status === 403) {
            errorMessage = 'No tienes permisos para buscar recursos.';
          } else if (error.response.status === 404) {
            errorMessage = 'Servicio de recursos no disponible.';
          }
          
          setError(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      setError(null);
      if (debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 2) {
        setError('Escribe al menos 2 caracteres para buscar');
      }
    }
  }, [debouncedSearchTerm, filterAvailable, showOnlyAvailable]);

  const handleSelect = (resource: Resource) => {
    console.log('✅ ResourceSearch: Recurso seleccionado:', {
      id: resource._id,
      title: resource.title,
      available: resource.available
    });
    
    onSelect(resource);
    setSearchTerm(resource.title);
    setIsOpen(false);
    setResults([]);
    setSelectedIndex(-1);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay para permitir hacer click en los resultados
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    setError(null);
    setHasSearched(false);
    onSelect(null);
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    setError(null);
    if (debouncedSearchTerm.length >= 2) {
      // Forzar nueva búsqueda
      const event = new Event('input', { bubbles: true });
      if (inputRef.current) {
        inputRef.current.dispatchEvent(event);
      }
    }
  };

  const getInputBorderColor = () => {
    if (error) return errorBorderColor;
    if (selectedResource) return 'green.300';
    return borderColor;
  };

  const getAvailabilityBadgeColor = (available: boolean) => {
    return available ? 'green' : 'red';
  };

  return (
    <Box position="relative">
      <InputGroup>
        <InputLeftElement>
          {isLoading ? (
            <Spinner size="sm" color="blue.500" />
          ) : (
            <Icon as={FiSearch} color="gray.400" />
          )}
        </InputLeftElement>
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          isDisabled={isDisabled}
          borderColor={getInputBorderColor()}
          _hover={{
            borderColor: error ? errorBorderColor : 'gray.300'
          }}
          _focus={{
            borderColor: error ? errorBorderColor : 'blue.500',
            boxShadow: error ? '0 0 0 1px red' : '0 0 0 1px blue'
          }}
        />
      </InputGroup>

      {/* Botón de limpiar cuando hay recurso seleccionado */}
      {selectedResource && (
        <Button
          position="absolute"
          right={2}
          top="50%"
          transform="translateY(-50%)"
          size="xs"
          variant="ghost"
          onClick={handleClear}
          zIndex={2}
        >
          ✕
        </Button>
      )}

      {/* Mensaje de error */}
      {error && (
        <Alert status="error" size="sm" mt={2} borderRadius="md">
          <AlertIcon />
          <VStack spacing={1} align="start" flex={1}>
            <Text fontSize="sm">{error}</Text>
            {error.includes('conexión') || error.includes('servidor') ? (
              <Button
                size="xs"
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={handleRetry}
                variant="outline"
                colorScheme="red"
              >
                Reintentar
              </Button>
            ) : null}
          </VStack>
        </Alert>
      )}

      {/* Mensaje cuando no hay resultados */}
      {isOpen && !isLoading && results.length === 0 && !error && hasSearched && debouncedSearchTerm.length >= 2 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          p={4}
          mt={1}
          boxShadow="lg"
        >
          <VStack spacing={2}>
            <Icon as={FiAlertCircle} color="gray.400" fontSize="lg" />
            <Text fontSize="sm" color="gray.500" textAlign="center">
              No se encontraron recursos con "{debouncedSearchTerm}"
            </Text>
            {(filterAvailable || showOnlyAvailable) && (
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Búsqueda limitada a recursos disponibles
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Información sobre recurso seleccionado */}
      {selectedResource && !isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={999}
          bg="green.50"
          border="1px solid"
          borderColor="green.200"
          borderRadius="md"
          p={2}
          mt={1}
        >
          <HStack spacing={2}>
            <Box flexShrink={0}>
              {selectedResource.coverImageUrl ? (
                <Image
                  src={selectedResource.coverImageUrl}
                  alt={selectedResource.title}
                  boxSize="24px"
                  objectFit="cover"
                  borderRadius="sm"
                />
              ) : (
                <Icon as={FiBook} fontSize="24px" color="green.600" />
              )}
            </Box>
            <VStack spacing={0} align="start" flex={1}>
              <Text fontSize="sm" fontWeight="medium" color="green.700">
                Recurso seleccionado
              </Text>
              <Text fontSize="xs" color="green.600" noOfLines={1}>
                {selectedResource.title}
              </Text>
            </VStack>
            <Badge colorScheme="green" size="sm">
              ✓ Seleccionado
            </Badge>
          </HStack>
        </Box>
      )}

      {/* Lista de resultados */}
      {isOpen && results.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          maxH="300px"
          overflowY="auto"
          mt={1}
        >
          <List ref={listRef}>
            {results.map((resource, index) => (
              <ListItem
                key={resource._id}
                p={3}
                cursor="pointer"
                bg={index === selectedIndex ? selectedBg : 'transparent'}
                _hover={{ bg: hoverBg }}
                onClick={() => handleSelect(resource)}
                borderBottom={index < results.length - 1 ? '1px solid' : 'none'}
                borderBottomColor={borderColor}
              >
                <HStack spacing={3} align="start">
                  <Box flexShrink={0}>
                    {resource.coverImageUrl ? (
                      <Image
                        src={resource.coverImageUrl}
                        alt={resource.title}
                        boxSize="40px"
                        objectFit="cover"
                        borderRadius="md"
                        fallback={<Icon as={FiBook} fontSize="40px" color="gray.400" />}
                      />
                    ) : (
                      <Icon as={FiBook} fontSize="40px" color="gray.400" />
                    )}
                  </Box>
                  
                  <VStack spacing={1} align="start" flex={1}>
                    <Text fontWeight="medium" fontSize="sm" noOfLines={2}>
                      {resource.title}
                    </Text>
                    
                    {/* Información de autores */}
                    {resource.authors && resource.authors.length > 0 && (
                      <Text fontSize="xs" color="gray.600" noOfLines={1}>
                        por {resource.authors.map(author => author.name).join(', ')}
                      </Text>
                    )}
                    
                    <HStack spacing={2} fontSize="xs" color="gray.500">
                      {/* ISBN */}
                      {resource.isbn && (
                        <Text>ISBN: {resource.isbn}</Text>
                      )}
                      
                      {/* Categoría */}
                      {resource.category && (
                        <>
                          <Text>•</Text>
                          <Text>{resource.category.name}</Text>
                        </>
                      )}
                      
                      {/* Tipo de recurso */}
                      {resource.type && (
                        <>
                          <Text>•</Text>
                          <Text>{resource.type.name}</Text>
                        </>
                      )}
                    </HStack>
                  </VStack>
                  
                  <VStack spacing={1} align="end">
                    <Badge 
                      colorScheme={getAvailabilityBadgeColor(resource.available)}
                      variant="subtle"
                      fontSize="xs"
                    >
                      {resource.available ? 'Disponible' : 'No disponible'}
                    </Badge>
                    
                    {/* Estado del recurso */}
                    {resource.state && (
                      <Badge 
                        size="xs" 
                        variant="outline"
                        colorScheme="gray"
                      >
                        {resource.state.name}
                      </Badge>
                    )}
                  </VStack>
                </HStack>
              </ListItem>
            ))}
          </List>
          
          {/* Footer con información adicional */}
          <Box p={2} bg="gray.50" borderBottomRadius="md">
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              {(filterAvailable || showOnlyAvailable) && ' (solo disponibles)'}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}