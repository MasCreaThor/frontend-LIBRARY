// src/components/inventory/ResourceForm/AuthorsSelector.tsx
'use client';

import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  IconButton,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  HStack,
  Text,
  Icon,
  Wrap,
  WrapItem,
  useDisclosure,
  Collapse,
  Spinner,
  List,
  ListItem,
  useOutsideClick,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { FiUser, FiSearch, FiPlus, FiX, FiUsers, FiCheck } from 'react-icons/fi';
import type { Author } from '@/services/resource.service';

interface AuthorsSelectorProps {
  authorsState: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Author[];
    isSearching: boolean;
    selectedAuthors: Author[];
    addAuthor: (author: Author) => void;
    removeAuthor: (authorId: string) => void;
    createNewAuthor: (name: string) => void;
  };
  isRequired: boolean;
  isFromGoogleBooks: boolean;
  error?: string;
}

/**
 * Subcomponente para selección y gestión de autores
 * Responsabilidad única: Búsqueda, selección y creación de autores
 */
export function AuthorsSelector({ 
  authorsState,
  isRequired,
  isFromGoogleBooks,
  error
}: AuthorsSelectorProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedAuthors,
    addAuthor,
    removeAuthor,
    createNewAuthor,
  } = authorsState;

  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cerrar resultados al hacer clic fuera
  useOutsideClick({
    ref: searchRef,
    handler: () => setShowResults(false),
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(value.length >= 2);
  };

  const handleSelectAuthor = (author: Author) => {
    addAuthor(author);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleCreateAuthor = () => {
    if (searchQuery.trim().length >= 2) {
      createNewAuthor(searchQuery.trim());
      setSearchQuery('');
      setShowResults(false);
    }
  };

  const isAuthorSelected = (authorId: string) => {
    return selectedAuthors.some(author => author._id === authorId);
  };

  const renderSearchResults = () => {
    if (!showResults || searchQuery.length < 2) return null;

    const filteredResults = searchResults.filter(author => 
      !isAuthorSelected(author._id)
    );

    return (
      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        zIndex={10}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        shadow="lg"
        maxH="200px"
        overflowY="auto"
      >
        {isSearching && (
          <Box p={3} textAlign="center">
            <Spinner size="sm" color="blue.500" />
            <Text fontSize="sm" color="gray.600" mt={1}>
              Buscando autores...
            </Text>
          </Box>
        )}

        {!isSearching && filteredResults.length === 0 && (
          <Box p={3}>
            <VStack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                No se encontraron autores con ese nombre
              </Text>
              <Button
                size="sm"
                leftIcon={<Icon as={FiPlus} />}
                colorScheme="blue"
                variant="outline"
                onClick={handleCreateAuthor}
              >
                Crear "{searchQuery}"
              </Button>
            </VStack>
          </Box>
        )}

        {!isSearching && filteredResults.length > 0 && (
          <List>
            {filteredResults.map((author) => (
              <ListItem
                key={author._id}
                p={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                borderBottom="1px solid"
                borderColor="gray.100"
                onClick={() => handleSelectAuthor(author)}
              >
                <HStack justify="space-between">
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" fontWeight="medium">
                      {author.name}
                    </Text>
                    {author.biography && (
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {author.biography}
                      </Text>
                    )}
                  </VStack>
                  <Icon as={FiPlus} color="blue.500" />
                </HStack>
              </ListItem>
            ))}

            {/* Opción para crear nuevo autor */}
            <ListItem
              p={3}
              cursor="pointer"
              _hover={{ bg: 'green.50' }}
              borderTop="1px solid"
              borderColor="gray.200"
              onClick={handleCreateAuthor}
            >
              <HStack>
                <Icon as={FiPlus} color="green.500" />
                <Text fontSize="sm" color="green.600" fontWeight="medium">
                  Crear nuevo autor: "{searchQuery}"
                </Text>
              </HStack>
            </ListItem>
          </List>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <FormControl isInvalid={!!error} isRequired={isRequired}>
        <FormLabel>
          <HStack spacing={2}>
            <Icon as={FiUsers} color="green.500" />
            <Text>Autores</Text>
            {isFromGoogleBooks && (
              <Badge colorScheme="green" size="sm">
                Google Books
              </Badge>
            )}
            {!isRequired && (
              <Badge colorScheme="gray" fontSize="xs">
                Opcional
              </Badge>
            )}
          </HStack>
        </FormLabel>

        {/* Campo de búsqueda */}
        <Box position="relative" ref={searchRef}>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar o crear autor..."
              onFocus={() => setShowResults(searchQuery.length >= 2)}
              disabled={isFromGoogleBooks && selectedAuthors.length > 0}
            />
            
            {searchQuery && (
              <InputRightElement>
                <IconButton
                  aria-label="Limpiar búsqueda"
                  icon={<FiX />}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                />
              </InputRightElement>
            )}
          </InputGroup>

          {renderSearchResults()}
        </Box>

        {error && <FormErrorMessage>{error}</FormErrorMessage>}

        <FormHelperText>
          {isRequired 
            ? 'Busca autores existentes o crea nuevos. Los libros requieren al menos un autor.'
            : 'Busca autores existentes o crea nuevos (opcional para este tipo de recurso).'
          }
        </FormHelperText>
      </FormControl>

      {/* Autores seleccionados */}
      {selectedAuthors.length > 0 && (
        <Box mt={4}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
            Autores seleccionados ({selectedAuthors.length}):
          </Text>
          
          <Wrap spacing={2}>
            {selectedAuthors.map((author) => (
              <WrapItem key={author._id}>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Icon as={FiUser} boxSize={3} />
                  <Text>{author.name}</Text>
                  {!isFromGoogleBooks && (
                    <IconButton
                      aria-label={`Remover ${author.name}`}
                      icon={<FiX />}
                      size="xs"
                      variant="ghost"
                      color="white"
                      _hover={{ bg: 'blue.600' }}
                      onClick={() => removeAuthor(author._id)}
                    />
                  )}
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {/* Información adicional para libros */}
      {isRequired && selectedAuthors.length === 0 && (
        <Alert status="info" mt={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Autor requerido</AlertTitle>
            <AlertDescription fontSize="xs">
              Los libros deben tener al menos un autor. Puedes buscar autores existentes 
              o crear nuevos escribiendo el nombre completo.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Mensaje de éxito si hay autores */}
      {selectedAuthors.length > 0 && (
        <Alert status="success" mt={4} borderRadius="md" size="sm">
          <AlertIcon />
          <Text fontSize="sm">
            {selectedAuthors.length === 1 
              ? '1 autor seleccionado' 
              : `${selectedAuthors.length} autores seleccionados`
            }
          </Text>
        </Alert>
      )}
    </Box>
  );
}