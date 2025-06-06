// src/components/inventory/ResourceForm/ResourceBasicFields.tsx
'use client';

import {
  HStack,
  VStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Badge,
  Icon,
  Text,
} from '@chakra-ui/react';
import { UseFormReturn } from 'react-hook-form';
import { FiBook, FiEdit, FiHash } from 'react-icons/fi';
import { ResourceTypeManager } from '@/lib/resourceType';
import type { DynamicResourceFormData } from '@/lib/validation/resourceValidation';

interface ResourceBasicFieldsProps {
  form: UseFormReturn<DynamicResourceFormData>;
  resourceTypeConfig: any;
  isFromGoogleBooks: boolean;
}

/**
 * Subcomponente para los campos básicos del recurso (título, tipo, volúmenes)
 * Responsabilidad única: Captura de información básica del recurso
 */
export function ResourceBasicFields({ 
  form, 
  resourceTypeConfig,
  isFromGoogleBooks 
}: ResourceBasicFieldsProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  
  const selectedTypeId = watch('typeId');
  const currentVolumes = watch('volumes');

  const handleTypeChange = (typeId: string) => {
    setValue('typeId', typeId);
    
    // Ajustar volúmenes por defecto según el tipo
    if (typeId) {
      // Esto se manejará en el hook principal, pero podemos dar feedback visual
      const newType = resourceTypeConfig;
      if (newType && !ResourceTypeManager.allowsMultipleVolumes(newType.name)) {
        setValue('volumes', 1);
      }
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Título del recurso */}
      <FormControl isInvalid={!!errors.title} isRequired>
        <FormLabel>
          <HStack spacing={2}>
            <Icon as={FiBook} color="blue.500" />
            <Text>Título del recurso</Text>
            {isFromGoogleBooks && (
              <Badge colorScheme="green" size="sm">
                Google Books
              </Badge>
            )}
          </HStack>
        </FormLabel>
        <Input
          {...register('title')}
          placeholder={resourceTypeConfig?.placeholder?.title || 'Nombre del recurso'}
          size="lg"
          disabled={isFromGoogleBooks}
        />
        <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        <FormHelperText>
          Nombre completo y descriptivo del recurso
        </FormHelperText>
      </FormControl>

      {/* Tipo de recurso y volúmenes */}
      <HStack spacing={4} align="start">
        <FormControl isInvalid={!!errors.typeId} flex={2} isRequired>
          <FormLabel>Tipo de recurso</FormLabel>
          <Select
            {...register('typeId')}
            placeholder="Selecciona el tipo"
            size="lg"
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {/* Las opciones se llenarán desde el componente padre */}
          </Select>
          <FormErrorMessage>{errors.typeId?.message}</FormErrorMessage>
          {resourceTypeConfig && (
            <FormHelperText>
              <HStack spacing={2}>
                <resourceTypeConfig.icon size={14} />
                <Text fontSize="sm">{resourceTypeConfig.description}</Text>
              </HStack>
            </FormHelperText>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.volumes} flex={1}>
          <FormLabel>
            <HStack spacing={2}>
              <Icon as={FiHash} color="purple.500" />
              <Text>Volúmenes/Unidades</Text>
            </HStack>
          </FormLabel>
          <NumberInput
            value={currentVolumes}
            onChange={(_, value) => setValue('volumes', value || 1)}
            min={1}
            max={resourceTypeConfig?.allowsMultipleVolumes ? 100 : 1}
            size="lg"
          >
            <NumberInputField {...register('volumes')} />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{errors.volumes?.message}</FormErrorMessage>
          <FormHelperText>
            {resourceTypeConfig?.allowsMultipleVolumes 
              ? 'Cantidad de volúmenes o unidades'
              : 'Generalmente 1 unidad'
            }
          </FormHelperText>
        </FormControl>
      </HStack>

      {/* Notas */}
      <FormControl isInvalid={!!errors.notes}>
        <FormLabel>
          <HStack spacing={2}>
            <Icon as={FiEdit} color="orange.500" />
            <Text>Notas adicionales</Text>
            <Badge colorScheme="gray" fontSize="xs">
              Opcional
            </Badge>
          </HStack>
        </FormLabel>
        <Textarea
          {...register('notes')}
          placeholder={resourceTypeConfig?.placeholder?.notes || 'Observaciones adicionales...'}
          rows={3}
          resize="vertical"
        />
        <FormErrorMessage>{errors.notes?.message}</FormErrorMessage>
        <FormHelperText>
          Estado físico, observaciones especiales, instrucciones de uso, etc.
        </FormHelperText>
      </FormControl>
    </VStack>
  );
}