// src/components/shared/PersonSearchInput/PersonSearchInput.tsx
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
  Avatar,
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
} from '@chakra-ui/react';
import { FiSearch, FiUser, FiX } from 'react-icons/fi';
import { useDebounce } from '@/hooks/useDebounce';
import { PersonService } from '@/services/person.service';
import type { Person } from '@/types/api.types';

interface PersonSearchInputProps {
  onPersonSelected: (person: Person | null) => void;
  selectedPerson: Person | null;
  placeholder?: string;
  isDisabled?: boolean;
  filterActive?: boolean;
  personType?: 'student' | 'teacher';
  error?: string;
  isRequired?: boolean;
}

interface SearchResult extends Person {
  fullName: string;
}

const PersonSearchInput: React.FC<PersonSearchInputProps> = ({
  onPersonSelected,
  selectedPerson,
  placeholder = "Buscar persona por nombre o documento...",
  isDisabled = false,
  filterActive = true,
  personType,
  error,
  isRequired = true
}) => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');

  // Efectos
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      performSearch(debouncedSearchTerm);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchTerm, personType, filterActive]);

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
  const performSearch = async (query: string) => {
    setIsSearching(true);
    setIsLoading(true);

    try {
      const filters: any = {
        search: query.trim(),
        limit: 20,
        page: 1
      };

      if (filterActive) {
        filters.status = 'active';
      }

      if (personType) {
        filters.personType = personType;
      }

      const response = await PersonService.getPeople(filters);
      
      // Enriquecer resultados con fullName
      const enrichedResults: SearchResult[] = response.data.map(person => ({
        ...person,
        fullName: person.fullName || `${person.firstName} ${person.lastName}`
      }));

      setSearchResults(enrichedResults);
      setShowResults(enrichedResults.length > 0);
    } catch (error) {
      console.error('Error searching people:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const handlePersonSelect = (person: SearchResult) => {
    onPersonSelected(person);
    setSearchTerm(person.fullName);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    onPersonSelected(null);
    setSearchTerm('');
    setShowResults(false);
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si se limpia el input, limpiar la selección
    if (!value.trim() && selectedPerson) {
      onPersonSelected(null);
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  // Formato de persona
  const formatPersonType = (type?: string) => {
    if (!type) return '';
    return type === 'student' ? 'Estudiante' : 'Profesor';
  };

  const getPersonTypeColor = (type?: string) => {
    return type === 'student' ? 'blue' : 'purple';
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
          value={selectedPerson ? selectedPerson.fullName || `${selectedPerson.firstName} ${selectedPerson.lastName}` : searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          isDisabled={isDisabled}
          borderColor={error ? 'red.300' : borderColor}
          _focus={{
            borderColor: error ? 'red.500' : 'blue.500',
            boxShadow: error ? '0 0 0 1px red.500' : '0 0 0 1px blue.500'
          }}
          bg={selectedPerson ? selectedBg : bgColor}
          pr={selectedPerson ? "40px" : "12px"}
        />
        {selectedPerson && (
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
          maxH="300px"
          overflowY="auto"
          mt={1}
        >
          <List spacing={0}>
            {searchResults.map((person, index) => (
              <React.Fragment key={person._id}>
                <ListItem
                  p={3}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handlePersonSelect(person)}
                >
                  <HStack spacing={3}>
                    <Avatar
                      size="sm"
                      name={person.fullName}
                      bg={getPersonTypeColor(person.personType?.name)}
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium" noOfLines={1}>
                          {person.fullName}
                        </Text>
                        {person.personType && (
                          <Badge
                            size="sm"
                            colorScheme={getPersonTypeColor(person.personType.name)}
                          >
                            {formatPersonType(person.personType.name)}
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing={4}>
                        {person.documentNumber && (
                          <Text fontSize="sm" color="gray.600">
                            Doc: {person.documentNumber}
                          </Text>
                        )}
                        {person.grade && (
                          <Text fontSize="sm" color="gray.600">
                            Grado: {person.grade}
                          </Text>
                        )}
                      </HStack>
                    </VStack>
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
              No se encontraron personas que coincidan con "{debouncedSearchTerm}"
            </Text>
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default PersonSearchInput;