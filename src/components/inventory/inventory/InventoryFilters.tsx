// src/components/inventory/InventoryFilters.tsx
'use client';

import {
  Box,
  HStack,
  VStack,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Button,
  IconButton,
  Collapse,
  Card,
  CardBody,
  Text,
  Badge,
  useDisclosure,
  useColorModeValue,
  Skeleton,
  FormControl,
  FormLabel,
  SimpleGrid,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiBook,
  FiTag,
  FiMapPin,
  FiTool,
  FiBarcode,
  FiUser,
  FiCheck,
  FiClock,
} from 'react-icons/fi';
import { useResourceFormData } from '@/hooks/useResources';
import type { ResourceSearchDto } from '@/services/resource.service';

export interface InventoryFiltersState {
  search: string;
  resourceType: 'book' | 'game' | 'map' | 'bible' | '';
  categoryId: string;
  locationId: string;
  stateId: string;
  availability: 'available' | 'borrowed' | '';
  isbn: string;
  author: string;
  publisher: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InventoryFiltersProps {
  filters: InventoryFiltersState;
  onFiltersChange: (filters: InventoryFiltersState) => void;
  onRefresh?: () => void;
  resultCount?: number;
  isLoading?: boolean;
  showResultCount?: boolean;
}

const defaultFilters: InventoryFiltersState = {
  search: '',
  resourceType: '',
  categoryId: '',
  locationId: '',
  stateId: '',
  availability: '',
  isbn: '',
  author: '',
  publisher: '',
  sortBy: 'title',
  sortOrder: 'asc',
};

export function InventoryFilters({
  filters,
  onFiltersChange,
  onRefresh,
  resultCount,
  isLoading = false,
  showResultCount = true,
}: InventoryFiltersProps) {
  const { isOpen: isExpanded, onToggle } = useDisclosure();
  const { data: formData, isLoading: isLoadingFormData } = useResourceFormData();
  
  const [localFilters, setLocalFilters] = useState<InventoryFiltersState>(filters);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Debounced search
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      onFiltersChange({
        ...localFilters,
        search: searchTerm,
      });
    }, 300);

    setSearchDebounceTimer(timer);
  }, [localFilters, onFiltersChange, searchDebounceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value }));
    debouncedSearch(value);
  };

  const handleFilterChange = (key: keyof InventoryFiltersState, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.search !== '' ||
      localFilters.resourceType !== '' ||
      localFilters.categoryId !== '' ||
      localFilters.locationId !== '' ||
      localFilters.stateId !== '' ||
      localFilters.availability !== '' ||
      localFilters.isbn !== '' ||
      localFilters.author !== '' ||
      localFilters.publisher !== '' ||
      localFilters.sortBy !== 'title' ||
      localFilters.sortOrder !== 'asc'
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.resourceType) count++;
    if (localFilters.categoryId) count++;
    if (localFilters.locationId) count++;
    if (localFilters.stateId) count++;
    if (localFilters.availability) count++;
    if (localFilters.isbn) count++;
    if (localFilters.author) count++;
    if (localFilters.publisher) count++;
    if (localFilters.sortBy !== 'title' || localFilters.sortOrder !== 'asc') count++;
    return count;
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Barra de búsqueda principal */}
      <HStack spacing={4}>
        <InputGroup flex={1}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Buscar por título, ISBN, autor o editorial..."
            value={localFilters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            bg={bg}
            borderColor={borderColor}
            size="lg"
          />
        </InputGroup>

        <Button
          leftIcon={<FiFilter />}
          variant="outline"
          onClick={onToggle}
          colorScheme={hasActiveFilters() ? 'blue' : 'gray'}
          size="lg"
        >
          Filtros
          {getActiveFiltersCount() > 0 && (
            <Badge ml={2} colorScheme="blue" borderRadius="full">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {onRefresh && (
          <Tooltip label="Actualizar datos">
            <IconButton
              aria-label="Actualizar"
              icon={<FiRefreshCw />}
              variant="outline"
              onClick={onRefresh}
              isLoading={isLoading}
              size="lg"
            />
          </Tooltip>
        )}
      </HStack>

      {/* Información de resultados */}
      {showResultCount && typeof resultCount === 'number' && (
        <HStack justify="space-between" color="gray.600" fontSize="sm">
          <Text>
            {resultCount === 0
              ? 'No se encontraron recursos'
              : `${resultCount} recurso${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`
            }
          </Text>
          
          {hasActiveFilters() && (
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<FiX />}
              onClick={handleClearFilters}
              color="gray.500"
            >
              Limpiar filtros
            </Button>
          )}
        </HStack>
      )}

      {/* Filtros avanzados */}
      <Collapse in={isExpanded} animateOpacity>
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Text fontWeight="medium" color="gray.700">
                Filtros Avanzados
              </Text>

              {isLoadingFormData ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height="80px" borderRadius="md" />
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  {/* Tipo de recurso */}
                  <FormControl>
                    <FormLabel fontSize="sm">Tipo de recurso</FormLabel>
                    <Select
                      value={localFilters.resourceType}
                      onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                      placeholder="Todos los tipos"
                      size="sm"
                    >
                      {formData.resourceTypes.map((type) => (
                        <option key={type._id} value={type.name}>
                          {type.description}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Categoría */}
                  <FormControl>
                    <FormLabel fontSize="sm">Categoría</FormLabel>
                    <Select
                      value={localFilters.categoryId}
                      onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                      placeholder="Todas las categorías"
                      size="sm"
                    >
                      {formData.categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Ubicación */}
                  <FormControl>
                    <FormLabel fontSize="sm">Ubicación</FormLabel>
                    <Select
                      value={localFilters.locationId}
                      onChange={(e) => handleFilterChange('locationId', e.target.value)}
                      placeholder="Todas las ubicaciones"
                      size="sm"
                    >
                      {formData.locations.map((location) => (
                        <option key={location._id} value={location._id}>
                          {location.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Estado */}
                  <FormControl>
                    <FormLabel fontSize="sm">Estado físico</FormLabel>
                    <Select
                      value={localFilters.stateId}
                      onChange={(e) => handleFilterChange('stateId', e.target.value)}
                      placeholder="Todos los estados"
                      size="sm"
                    >
                      {formData.resourceStates.map((state) => (
                        <option key={state._id} value={state._id}>
                          {state.description}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Disponibilidad */}
                  <FormControl>
                    <FormLabel fontSize="sm">Disponibilidad</FormLabel>
                    <Select
                      value={localFilters.availability}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                      placeholder="Todos"
                      size="sm"
                    >
                      <option value="available">Disponible</option>
                      <option value="borrowed">Prestado</option>
                    </Select>
                  </FormControl>

                  {/* ISBN */}
                  <FormControl>
                    <FormLabel fontSize="sm">ISBN</FormLabel>
                    <Input
                      value={localFilters.isbn}
                      onChange={(e) => handleFilterChange('isbn', e.target.value)}
                      placeholder="Filtrar por ISBN"
                      size="sm"
                    />
                  </FormControl>

                  {/* Autor */}
                  <FormControl>
                    <FormLabel fontSize="sm">Autor</FormLabel>
                    <Input
                      value={localFilters.author}
                      onChange={(e) => handleFilterChange('author', e.target.value)}
                      placeholder="Filtrar por autor"
                      size="sm"
                    />
                  </FormControl>

                  {/* Editorial */}
                  <FormControl>
                    <FormLabel fontSize="sm">Editorial</FormLabel>
                    <Input
                      value={localFilters.publisher}
                      onChange={(e) => handleFilterChange('publisher', e.target.value)}
                      placeholder="Filtrar por editorial"
                      size="sm"
                    />
                  </FormControl>
                </SimpleGrid>
              )}

              {/* Ordenamiento */}
              <Box>
                <FormLabel fontSize="sm">Ordenar por</FormLabel>
                <HStack spacing={4}>
                  <Select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    size="sm"
                    flex={2}
                  >
                    <option value="title">Título</option>
                    <option value="createdAt">Fecha de registro</option>
                    <option value="type">Tipo</option>
                    <option value="category">Categoría</option>
                    <option value="state">Estado</option>
                    <option value="location">Ubicación</option>
                  </Select>
                  <Select
                    value={localFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    size="sm"
                    flex={1}
                  >
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </Select>
                </HStack>
              </Box>

              {/* Acciones */}
              <HStack justify="flex-end" pt={2}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters()}
                  leftIcon={<FiX />}
                >
                  Limpiar filtros
                </Button>
                <Button
                  size="sm"
                  onClick={onToggle}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Collapse>

      {/* Filtros activos (tags) */}
      {hasActiveFilters() && (
        <HStack wrap="wrap" spacing={2}>
          {localFilters.resourceType && (
            <Badge
              colorScheme="blue"
              variant="subtle"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <FiBook size={12} />
              Tipo: {formData.resourceTypes.find(t => t.name === localFilters.resourceType)?.description}
              <IconButton
                aria-label="Remover filtro"
                icon={<FiX />}
                size="xs"
                variant="ghost"
                onClick={() => handleFilterChange('resourceType', '')}
                ml={1}
                h="auto"
                minW="auto"
                p={0}
              />
            </Badge>
          )}

          {localFilters.categoryId && (
            <Badge
              colorScheme="purple"
              variant="subtle"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <FiTag size={12} />
              Categoría: {formData.categories.find(c => c._id === localFilters.categoryId)?.name}
              <IconButton
                aria-label="Remover filtro"
                icon={<FiX />}
                size="xs"
                variant="ghost"
                onClick={() => handleFilterChange('categoryId', '')}
                ml={1}
                h="auto"
                minW="auto"
                p={0}
              />
            </Badge>
          )}

          {localFilters.availability && (
            <Badge
              colorScheme={localFilters.availability === 'available' ? 'green' : 'orange'}
              variant="subtle"
              display="flex"
              alignItems="center"
              gap={1}
            >
              {localFilters.availability === 'available' ? <FiCheck size={12} /> : <FiClock size={12} />}
              {localFilters.availability === 'available' ? 'Disponible' : 'Prestado'}
              <IconButton
                aria-label="Remover filtro"
                icon={<FiX />}
                size="xs"
                variant="ghost"
                onClick={() => handleFilterChange('availability', '')}
                ml={1}
                h="auto"
                minW="auto"
                p={0}
              />
            </Badge>
          )}

          {localFilters.author && (
            <Badge
              colorScheme="green"
              variant="subtle"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <FiUser size={12} />
              Autor: {localFilters.author}
              <IconButton
                aria-label="Remover filtro"
                icon={<FiX />}
                size="xs"
                variant="ghost"
                onClick={() => handleFilterChange('author', '')}
                ml={1}
                h="auto"
                minW="auto"
                p={0}
              />
            </Badge>
          )}
        </HStack>
      )}
    </VStack>
  );
}