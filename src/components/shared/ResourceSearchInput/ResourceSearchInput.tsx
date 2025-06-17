// src/components/shared/ResourceSearchInput/ResourceSearchInput.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  useColorModeValue,
  List,
  ListItem,
  Divider,
  Icon,
  Button,
  Alert,
  AlertIcon,
  Tooltip,
} from '@chakra-ui/react';
import { FiSearch, FiBook, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchResources } from '@/hooks/useResources'; // ← Usar hook existente
import type { Resource } from '@/types/api.types'; // ← Usar tipos existentes

interface ResourceSearchInputProps {
  onResourceSelected: (resource: Resource | null) => void;
  selectedResource: Resource | null;
  placeholder?: string;
  isDisabled?: boolean;
  availableOnly?: boolean;
  error?: string;
  isRequired?: boolean;
  showStock?: boolean;
}

const ResourceSearchInput: React.FC<ResourceSearchInputProps> = ({
  onResourceSelected,
  selectedResource,
  placeholder = "Buscar recurso por título, autor o ISBN...",
  isDisabled = false,
  availableOnly = true,
  error,
  isRequired = true,
  showStock = true
}) => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ← Usar hook existente de useResources
  const { data: searchResults = [], isLoading } = useSearchResources(
    debouncedSearchTerm,
    20,
    availableOnly
  );

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('green.50', 'green.900');

  // Efectos
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2 && searchResults.length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [debouncedSearchTerm, searchResults]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Funciones
  const handleResourceSelect = (resource: Resource) => {
    onResourceSelected(resource);
    setSearchTerm(resource.title);
    setShowResults(false);
  };

  const handleClearSelection = () => {
    onResourceSelected(null);
    setSearchTerm('');
    setShowResults(false);
    searchInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si se limpia el input, limpiar la selección
    if (!value.trim() && selectedResource) {
      onResourceSelected(null);
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0 && debouncedSearchTerm.length >= 2) {
      setShowResults(true);
    }
  };

  // Funciones de formato
  const getAvailabilityColor = (resource: Resource) => {
    if (!resource.available) return 'red';
    const available = resource.availableQuantity || 0;
    if (available <= 2) return 'orange';
    return 'green';
  };

  const getAvailabilityText = (resource: Resource) => {
    if (!resource.available) return 'No disponible';
    const available = resource.availableQuantity || 0;
    if (available === 0) return 'Sin stock';
    if (available === 1) return '1 disponible';
    return `${available} disponibles`;
  };

  const isResourceAvailable = (resource: Resource) => {
    return resource.available && (resource.availableQuantity || 0) > 0;
  };

  return (
    <Box position="relative" w="full">
      {/* Input de búsqueda */}
      <InputGroup>
        <InputLeftElement>
          {isLoading ? (
            <Spinner size="sm" color="blue.500" />
          ) : (
            <Icon as={FiSearch} color="gray.500" />
          )}
        </InputLeftElement>
        <Input
          ref={searchInputRef}
          value={selectedResource ? selectedResource.title : searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          isDisabled={isDisabled}
          borderColor={error ? 'red.300' : borderColor}
          _focus={{
            borderColor: error ? 'red.500' : 'blue.500',
            boxShadow: error ? '0 0 0 1px red.500' : '0 0 0 1px blue.500'
          }}
          bg={selectedResource ? selectedBg : bgColor}
          pr={selectedResource ? "40px" : "12px"}
        />
        {selectedResource && (
          <Button
            position="absolute"
            right="8px"
            top="50%"
            transform="translateY(-50%)"
            size="xs"
            variant="ghost"
            onClick={handleClearSelection}
            zIndex={2}
          >
            <Icon as={FiX} />
          </Button>
        )}
      </InputGroup>

      {/* Error message */}
      {error && (
        <Text color="red.500" fontSize="sm" mt={1}>
          {error}
        </Text>
      )}

      {/* Resultados de búsqueda */}
      {showResults && searchResults.length > 0 && (
        <Box
          ref={resultsRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          maxH="400px"
          overflowY="auto"
          mt={1}
        >
          <List spacing={0}>
            {searchResults.map((resource, index) => (
              <React.Fragment key={resource._id}>
                <ListItem
                  p={3}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleResourceSelect(resource)}
                  opacity={isResourceAvailable(resource) ? 1 : 0.7}
                >
                  <HStack spacing={3} align="start">
                    <Icon
                      as={FiBook}
                      color={isResourceAvailable(resource) ? "blue.500" : "gray.400"}
                      mt={1}
                    />
                    <VStack align="start" spacing={2} flex={1}>
                      {/* Título y disponibilidad */}
                      <HStack justify="space-between" w="full" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="medium" noOfLines={2}>
                            {resource.title}
                          </Text>
                          {resource.author && (
                            <Text fontSize="sm" color="gray.600" noOfLines={1}>
                              por {resource.author}
                            </Text>
                          )}
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Badge
                            colorScheme={getAvailabilityColor(resource)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {getAvailabilityText(resource)}
                          </Badge>
                          {showStock && resource.totalQuantity && (
                            <Text fontSize="xs" color="gray.500">
                              Total: {resource.totalQuantity}
                            </Text>
                          )}
                        </VStack>
                      </HStack>

                      {/* Información adicional */}
                      <HStack spacing={4} wrap="wrap">
                        {resource.isbn && (
                          <Text fontSize="sm" color="gray.600">
                            ISBN: {resource.isbn}
                          </Text>
                        )}
                        {resource.category && (
                          <Text fontSize="sm" color="gray.600">
                            {resource.category}
                          </Text>
                        )}
                        {showStock && resource.currentLoansCount !== undefined && (
                          <Text fontSize="sm" color="gray.600">
                            En préstamo: {resource.currentLoansCount}
                          </Text>
                        )}
                      </HStack>

                      {/* Estado del recurso */}
                      {resource.state && (
                        <Badge
                          size="sm"
                          colorScheme={resource.state.name === 'good' ? 'green' : 'yellow'}
                        >
                          {resource.state.name === 'good' ? 'Buen estado' : 
                           resource.state.name === 'deteriorated' ? 'Deteriorado' :
                           resource.state.name === 'damaged' ? 'Dañado' : 'Estado desconocido'}
                        </Badge>
                      )}
                    </VStack>

                    {/* Indicador visual de disponibilidad */}
                    <Box>
                      {isResourceAvailable(resource) ? (
                        <Tooltip label="Disponible para préstamo">
                          <Box>
                            <Icon as={FiCheckCircle} color="green.500" />
                          </Box>
                        </Tooltip>
                      ) : (
                        <Tooltip label="No disponible para préstamo">
                          <Box>
                            <Icon as={FiAlertCircle} color="red.500" />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </HStack>
                </ListItem>
                {index < searchResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {/* Información adicional */}
          <Box p={2} bg={useColorModeValue('gray.50', 'gray.700')} borderTopWidth={1}>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              {availableOnly && ' • Solo recursos disponibles'}
            </Text>
          </Box>
        </Box>
      )}

      {/* Estado de búsqueda sin resultados */}
      {showResults && searchResults.length === 0 && !isLoading && debouncedSearchTerm.length >= 2 && (
        <Box
          ref={resultsRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          mt={1}
          p={4}
        >
          <Alert status="info" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              No se encontraron recursos que coincidan con "{debouncedSearchTerm}"
              {availableOnly && ' entre los recursos disponibles'}
            </Text>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ResourceSearchInput;