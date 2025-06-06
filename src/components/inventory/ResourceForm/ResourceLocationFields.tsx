// src/components/inventory/ResourceForm/ResourceLocationFields.tsx
'use client';

import {
  HStack,
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Select,
  Badge,
  Icon,
  Text,
  Box,
  Skeleton,
} from '@chakra-ui/react';
import { UseFormReturn } from 'react-hook-form';
import { FiMapPin, FiTag, FiTool } from 'react-icons/fi';
import type { DynamicResourceFormData } from '@/lib/validation/resourceValidation';
import type { Category, Location, ResourceState } from '@/types/api.types';

interface ResourceLocationFieldsProps {
  form: UseFormReturn<DynamicResourceFormData>;
  categories: Category[];
  locations: Location[];
  resourceStates: ResourceState[];
  isLoading: boolean;
  suggestedCategories?: Category[];
}

/**
 * Subcomponente para los campos de ubicación, categoría y estado
 * Responsabilidad única: Selección de metadatos de clasificación
 */
export function ResourceLocationFields({ 
  form, 
  categories,
  locations,
  resourceStates,
  isLoading,
  suggestedCategories = []
}: ResourceLocationFieldsProps) {
  const { register, formState: { errors } } = form;

  // Renderizar opciones de categoría con sugerencias destacadas
  const renderCategoryOptions = () => {
    const suggested = suggestedCategories.map(cat => cat._id);
    const otherCategories = categories.filter(cat => !suggested.includes(cat._id));
    
    return (
      <>
        {suggestedCategories.length > 0 && (
          <optgroup label="📚 Sugeridas para este tipo">
            {suggestedCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </optgroup>
        )}
        {otherCategories.length > 0 && (
          <optgroup label="📖 Todas las categorías">
            {otherCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </optgroup>
        )}
      </>
    );
  };

  // Renderizar indicador de color para categorías
  const renderCategoryWithColor = (category: Category) => (
    <HStack spacing={2} key={category._id}>
      <Box
        w={3}
        h={3}
        borderRadius="full"
        bg={category.color}
      />
      <Text fontSize="sm">{category.name}</Text>
    </HStack>
  );

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="80px" borderRadius="md" />
        <HStack spacing={4}>
          <Skeleton height="80px" flex={1} borderRadius="md" />
          <Skeleton height="80px" flex={1} borderRadius="md" />
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Categoría */}
      <FormControl isInvalid={!!errors.categoryId} isRequired>
        <FormLabel>
          <HStack spacing={2}>
            <Icon as={FiTag} color="purple.500" />
            <Text>Categoría</Text>
          </HStack>
        </FormLabel>
        <Select
          {...register('categoryId')}
          placeholder="Selecciona una categoría"
          size="lg"
        >
          {renderCategoryOptions()}
        </Select>
        <FormErrorMessage>{errors.categoryId?.message}</FormErrorMessage>
        <FormHelperText>
          Clasifica el recurso por área temática
        </FormHelperText>
      </FormControl>

      {/* Estado y Ubicación */}
      <HStack spacing={4} align="start">
        <FormControl isInvalid={!!errors.stateId} flex={1} isRequired>
          <FormLabel>
            <HStack spacing={2}>
              <Icon as={FiTool} color="orange.500" />
              <Text>Estado físico</Text>
            </HStack>
          </FormLabel>
          <Select
            {...register('stateId')}
            placeholder="Selecciona el estado"
            size="lg"
          >
            {resourceStates.map((state) => (
              <option key={state._id} value={state._id}>
                {state.description}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.stateId?.message}</FormErrorMessage>
          <FormHelperText>
            Condición actual del recurso
          </FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!errors.locationId} flex={1} isRequired>
          <FormLabel>
            <HStack spacing={2}>
              <Icon as={FiMapPin} color="green.500" />
              <Text>Ubicación</Text>
            </HStack>
          </FormLabel>
          <Select
            {...register('locationId')}
            placeholder="Selecciona ubicación"
            size="lg"
          >
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.locationId?.message}</FormErrorMessage>
          <FormHelperText>
            Estante o lugar donde se almacena
          </FormHelperText>
        </FormControl>
      </HStack>

      {/* Información visual de categorías disponibles */}
      {categories.length > 0 && (
        <Box
          p={3}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
            Categorías disponibles:
          </Text>
          <VStack spacing={1} align="stretch" maxH="100px" overflowY="auto">
            {categories.slice(0, 6).map(renderCategoryWithColor)}
            {categories.length > 6 && (
              <Text fontSize="xs" color="gray.500">
                +{categories.length - 6} categorías más...
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}