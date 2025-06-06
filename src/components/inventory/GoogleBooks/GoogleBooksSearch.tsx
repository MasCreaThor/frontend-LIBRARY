// src/components/inventory/GoogleBooks/GoogleBooksSearch.tsx
'use client';

import {
  Box,
  VStack,
  HStack,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Input,
  Button,
  IconButton,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Icon,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { 
  FiSearch, 
  FiX, 
  FiBook, 
  FiUser, 
  FiBarcode,
  FiWifiOff,
  FiRefreshCw,
  FiInfo
} from 'react-icons/fi';
import { useSmartGoogleBooksSearch, useGoogleBooksStatus } from '@/hooks/useGoogleBooks';
import { GoogleBooksResults } from './GoogleBooksResults';
import { GoogleBooksService } from '@/services/googleBooks.service';
import type { GoogleBooksVolumeDto } from '@/services/googleBooks.service';

interface GoogleBooksSearchProps {
  onBookSelect: (book: GoogleBooksVolumeDto) => void;
  onManualEntry: () => void;
  disabled?: boolean;
}

interface SearchCriteria {
  query: string;
  title: string;
  author: string;
  isbn: string;
}

/**
 * Componente principal para búsqueda en Google Books
 * Responsabilidades:
 * - Interfaz de búsqueda con múltiples estrategias
 * - Manejo del estado de la API
 * - Coordinación de resultados
 */
export function GoogleBooksSearch({ 
  onBookSelect, 
  onManualEntry, 
  disabled = false 
}: GoogleBooksSearchProps) {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    query: '',
    title: '',
    author: '',
    isbn: '',
  });
  const [activeTab, setActiveTab] = useState(0);

  // Estado de la API
  const { data: apiStatus } = useGoogleBooksStatus();
  
  // Hook de búsqueda inteligente
  const {
    results,
    isLoading,
    error,
    currentStrategy,
    searchWithFallback,
    reset,
    hasResults,
  } = useSmartGoogleBooksSearch();

  const isApiAvailable = apiStatus?.available ?? true;
  const quotaRemaining = apiStatus?.quota?.remaining ?? 1000;
  const quotaWarning = quotaRemaining < 100;

  const handleSearch = useCallback(async () => {
    if (disabled || !isApiAvailable) return;

    const criteria = searchCriteria;
    
    // Determinar qué criterios usar según la pestaña activa
    switch (activeTab) {
      case 0: // Búsqueda general
        if (!criteria.query.trim()) return;
        await searchWithFallback({ query: criteria.query });
        break;
      case 1: // Por título
        if (!criteria.title.trim()) return;
        await searchWithFallback({ title: criteria.title });
        break;
      case 2: // Por autor
        if (!criteria.author.trim()) return;
        await searchWithFallback({ author: criteria.author });
        break;
      case 3: // Por ISBN
        if (!criteria.isbn.trim()) return;
        await searchWithFallback({ isbn: criteria.isbn });
        break;
    }
  }, [searchCriteria, activeTab, searchWithFallback, disabled, isApiAvailable]);

  const handleInputChange = (field: keyof SearchCriteria, value: string) => {
    setSearchCriteria(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setSearchCriteria({
      query: '',
      title: '',
      author: '',
      isbn: '',
    });
    reset();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSearch();
    }
  };

  const getSearchButtonText = () => {
    const strategies = ['Buscar', 'Buscar por título', 'Buscar por autor', 'Buscar por ISBN'];
    return strategies[activeTab] || 'Buscar';
  };

  const getCurrentSearchValue = () => {
    switch (activeTab) {
      case 0: return searchCriteria.query;
      case 1: return searchCriteria.title;
      case 2: return searchCriteria.author;
      case 3: return searchCriteria.isbn;
      default: return '';
    }
  };

  const isSearchDisabled = () => {
    return disabled || !isApiAvailable || isLoading || !getCurrentSearchValue().trim();
  };

  const renderSearchField = (
    field: keyof SearchCriteria,
    placeholder: string,
    icon: any,
    type: 'text' | 'search' = 'search'
  ) => (
    <InputGroup size="lg">
      <InputLeftElement pointerEvents="none">
        <Icon as={icon} color="gray.400" />
      </InputLeftElement>
      <Input
        value={searchCriteria[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
        disabled={disabled || !isApiAvailable}
        type={type}
      />
      {searchCriteria[field] && (
        <InputRightElement>
          <IconButton
            aria-label="Limpiar"
            icon={<FiX />}
            size="sm"
            variant="ghost"
            onClick={() => handleInputChange(field, '')}
          />
        </InputRightElement>
      )}
    </InputGroup>
  );

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box bg={cardBg} borderRadius="xl" p={6} shadow="sm" border="1px" borderColor="gray.200">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <HStack spacing={2}>
              <Icon as={FiBook} color="green.500" boxSize={6} />
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                Búsqueda en Google Books
              </Text>
              {quotaWarning && (
                <Badge colorScheme="orange" variant="subtle">
                  Cuota baja
                </Badge>
              )}
            </HStack>
            <Text fontSize="sm" color="gray.600">
              Encuentra libros y completa automáticamente la información
            </Text>
          </VStack>

          <Button
            variant="outline"
            size="sm"
            onClick={onManualEntry}
            disabled={disabled}
          >
            Registro Manual
          </Button>
        </HStack>

        {/* Estado de la API */}
        {!isApiAvailable && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Google Books no disponible</AlertTitle>
              <AlertDescription fontSize="sm">
                No se puede conectar con Google Books. Usa el registro manual o intenta más tarde.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {quotaWarning && isApiAvailable && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Cuota limitada</AlertTitle>
              <AlertDescription fontSize="sm">
                Quedan {quotaRemaining} búsquedas disponibles hoy. Usa búsquedas específicas.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Pestañas de búsqueda */}
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiSearch} boxSize={4} />
                <Text>General</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiBook} boxSize={4} />
                <Text>Título</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiUser} boxSize={4} />
                <Text>Autor</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiBarcode} boxSize={4} />
                <Text>ISBN</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <VStack spacing={4}>
                {renderSearchField('query', 'Ej: Cien años de soledad García Márquez', FiSearch)}
                <Text fontSize="sm" color="gray.600">
                  Búsqueda general por título, autor, o palabras clave
                </Text>
              </VStack>
            </TabPanel>
            
            <TabPanel px={0}>
              <VStack spacing={4}>
                {renderSearchField('title', 'Ej: Cien años de soledad', FiBook)}
                <Text fontSize="sm" color="gray.600">
                  Búsqueda específica por título del libro
                </Text>
              </VStack>
            </TabPanel>
            
            <TabPanel px={0}>
              <VStack spacing={4}>
                {renderSearchField('author', 'Ej: Gabriel García Márquez', FiUser)}
                <Text fontSize="sm" color="gray.600">
                  Búsqueda por nombre del autor
                </Text>
              </VStack>
            </TabPanel>
            
            <TabPanel px={0}>
              <VStack spacing={4}>
                {renderSearchField('isbn', 'Ej: 9788437604947', FiBarcode, 'text')}
                <Text fontSize="sm" color="gray.600">
                  Búsqueda exacta por código ISBN (10 o 13 dígitos)
                </Text>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Botones de acción */}
        <HStack spacing={3}>
          <Button
            colorScheme="green"
            size="lg"
            leftIcon={isLoading ? <Spinner size="sm" /> : <Icon as={FiSearch} />}
            onClick={handleSearch}
            disabled={isSearchDisabled()}
            isLoading={isLoading}
            loadingText="Buscando..."
            flex={1}
          >
            {getSearchButtonText()}
          </Button>
          
          {(hasResults || error) && (
            <IconButton
              aria-label="Limpiar búsqueda"
              icon={<FiX />}
              onClick={handleClear}
              variant="outline"
              size="lg"
            />
          )}
        </HStack>

        {/* Información de la estrategia actual */}
        {isLoading && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              Buscando usando estrategia: <strong>{currentStrategy}</strong>
            </Text>
          </Alert>
        )}

        {/* Error de búsqueda */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error en la búsqueda</AlertTitle>
              <AlertDescription fontSize="sm">
                {error}. Intenta con otros términos o usa el registro manual.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Información de ayuda */}
        {!hasResults && !isLoading && !error && (
          <Box 
            p={4} 
            bg="blue.50" 
            borderRadius="md" 
            border="1px solid" 
            borderColor="blue.200"
          >
            <HStack spacing={2} mb={2}>
              <Icon as={FiInfo} color="blue.500" />
              <Text fontSize="sm" fontWeight="medium" color="blue.800">
                Consejos para mejores resultados
              </Text>
            </HStack>
            <VStack spacing={1} align="start" fontSize="sm" color="blue.700">
              <Text>• Usa el ISBN para resultados exactos</Text>
              <Text>• Combina título y autor para mayor precisión</Text>
              <Text>• Evita acentos y caracteres especiales</Text>
              <Text>• Si no encuentras el libro, usa "Registro Manual"</Text>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Resultados */}
      {hasResults && (
        <>
          <Divider my={6} />
          <GoogleBooksResults
            results={results}
            onSelect={onBookSelect}
            onManualEntry={onManualEntry}
            searchStrategy={currentStrategy}
          />
        </>
      )}
    </Box>
  );
}