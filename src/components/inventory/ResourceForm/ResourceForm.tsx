// src/components/inventory/ResourceForm/ResourceForm.tsx
'use client';

import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Text,
  Button,
  Icon,
  useColorModeValue,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiBook, FiCheck, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useResourceForm } from './useResourceForm';
import { ResourceBasicFields } from './ResourceBasicFields';
import { ResourceLocationFields } from './ResourceLocationFields';
import { ISBNValidationField } from './ISBNValidationField';
import { AuthorsSelector } from './AuthorsSelector';
import { ResourceTypeManager } from '@/lib/resourceType';
import type { Resource, CreateResourceDto, UpdateResourceDto } from '@/types/api.types';
import type { GoogleBooksVolumeDto } from '@/services/googleBooks.service';

// Tipos para los props del formulario
interface ResourceFormCreateProps {
  resource?: never;
  googleBooksData?: GoogleBooksVolumeDto;
  onSubmit: (data: CreateResourceDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: false;
}

interface ResourceFormEditProps {
  resource: Resource;
  googleBooksData?: never;
  onSubmit: (data: UpdateResourceDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit: true;
}

type ResourceFormProps = ResourceFormCreateProps | ResourceFormEditProps;

/**
 * Componente principal del formulario de recursos
 * 
 * Responsabilidades:
 * - Coordinación de subcomponentes
 * - Presentación de la UI principal
 * - Manejo de estados de carga y errores
 * 
 * Lógica de negocio delegada a:
 * - useResourceForm (hook personalizado)
 * - ResourceValidationSchemaFactory (validaciones)
 * - ResourceBusinessRules (reglas de negocio)
 */
export function ResourceForm(props: ResourceFormProps) {
  const {
    onSubmit,
    onCancel,
    isLoading = false,
  } = props;
  
  const resource = 'resource' in props ? props.resource : undefined;
  const googleBooksData = 'googleBooksData' in props ? props.googleBooksData : undefined;
  const isEdit = 'isEdit' in props ? !!props.isEdit : false;

  const {
    form,
    selectedResourceType,
    resourceTypeConfig,
    isBook,
    isGame,
    isMap,
    isBible,
    formData,
    isbnValidation,
    authorsState,
    publisherState,
    isLoading: isFormLoading,
    handleSubmit,
    businessRulesErrors,
    isFromGoogleBooks,
    googleBooksInfo,
  } = useResourceForm({
    resource,
    isEdit,
    googleBooksData,
    onSubmit,
    onCancel,
  });

  // Estados derivados para UI
  const { formState: { isValid, isDirty } } = form;
  const canSubmit = isValid && isDirty && !isbnValidation.hasConflict && businessRulesErrors.length === 0;

  // Obtener categorías sugeridas para el tipo de recurso
  const suggestedCategories = selectedResourceType 
    ? ResourceTypeManager.getSuggestedCategories(selectedResourceType.name, formData.categories)
    : [];

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Card bg={cardBg} shadow="sm">
      <CardBody p={8}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box>
              <HStack spacing={4} mb={2}>
                <Button
                  leftIcon={<FiArrowLeft />}
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  color="gray.600"
                >
                  Volver
                </Button>
              </HStack>
              
              <HStack spacing={3} mb={4}>
                <Box
                  p={3}
                  bg={resourceTypeConfig ? `${resourceTypeConfig.color}.50` : 'blue.50'}
                  borderRadius="xl"
                >
                  {resourceTypeConfig ? (
                    <resourceTypeConfig.icon size={32} color={`var(--chakra-colors-${resourceTypeConfig.color}-500)`} />
                  ) : (
                    <FiBook size={32} color="#3182CE" />
                  )}
                </Box>
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                      {isEdit ? 'Editar Recurso' : 'Registrar Nuevo Recurso'}
                    </Text>
                    {isFromGoogleBooks && (
                      <Badge colorScheme="green" variant="solid">
                        Google Books
                      </Badge>
                    )}
                  </HStack>
                  <Text color="gray.600" fontSize="lg">
                    {isEdit 
                      ? 'Modifica la información del recurso registrado'
                      : resourceTypeConfig
                        ? `Registra un nuevo ${resourceTypeConfig.label.toLowerCase()} en el inventario`
                        : 'Completa la información para registrar un nuevo recurso'
                    }
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Información de Google Books */}
            {isFromGoogleBooks && googleBooksInfo && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Datos de Google Books</AlertTitle>
                  <AlertDescription fontSize="sm">
                    Los campos de título, autores y editorial se han completado automáticamente 
                    desde Google Books. Puedes modificar la categoría, ubicación y estado según tus necesidades.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Errores de reglas de negocio */}
            {businessRulesErrors.length > 0 && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Errores de validación</AlertTitle>
                  <AlertDescription>
                    <VStack align="start" spacing={1} mt={2}>
                      {businessRulesErrors.map((error, index) => (
                        <Text key={index} fontSize="sm">• {error}</Text>
                      ))}
                    </VStack>
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Información básica */}
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="semibold" color="gray.700" fontSize="lg" mb={4}>
                  Información Básica
                </Text>
                <ResourceBasicFields
                  form={form}
                  resourceTypeConfig={resourceTypeConfig}
                  isFromGoogleBooks={isFromGoogleBooks}
                />
              </Box>

              <Divider />

              {/* Campos específicos para libros */}
              {(isBook || isBible) && (
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize="lg" mb={4}>
                    Información Bibliográfica
                  </Text>
                  <VStack spacing={6} align="stretch">
                    <ISBNValidationField
                      form={form}
                      isbnValidation={isbnValidation}
                      isRequired={isBook}
                      isFromGoogleBooks={isFromGoogleBooks}
                    />
                    
                    <AuthorsSelector
                      authorsState={authorsState}
                      isRequired={isBook}
                      isFromGoogleBooks={isFromGoogleBooks}
                      error={form.formState.errors.authorIds?.message}
                    />
                  </VStack>
                </Box>
              )}

              {/* Separador solo si hay campos bibliográficos */}
              {(isBook || isBible) && <Divider />}

              {/* Clasificación y ubicación */}
              <Box>
                <Text fontWeight="semibold" color="gray.700" fontSize="lg" mb={4}>
                  Clasificación y Ubicación
                </Text>
                <ResourceLocationFields
                  form={form}
                  categories={formData.categories}
                  locations={formData.locations}
                  resourceStates={formData.resourceStates}
                  isLoading={isFormLoading}
                  suggestedCategories={suggestedCategories}
                />
              </Box>
            </VStack>

            <Divider />

            {/* Resumen del recurso */}
            {resourceTypeConfig && (
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontWeight="medium" color="gray.700" mb={3}>
                  Resumen del Recurso
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <VStack spacing={2} align="start">
                    <Text fontSize="sm">
                      <strong>Tipo:</strong> {resourceTypeConfig.label}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Requiere ISBN:</strong> {resourceTypeConfig.requiresISBN ? 'Sí' : 'No'}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Requiere Autores:</strong> {resourceTypeConfig.requiresAuthors ? 'Sí' : 'No'}
                    </Text>
                  </VStack>
                  <VStack spacing={2} align="start">
                    <Text fontSize="sm">
                      <strong>Múltiples Volúmenes:</strong> {resourceTypeConfig.allowsMultipleVolumes ? 'Sí' : 'No'}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Autores Seleccionados:</strong> {authorsState.selectedAuthors.length}
                    </Text>
                    <Text fontSize="sm">
                      <strong>Desde Google Books:</strong> {isFromGoogleBooks ? 'Sí' : 'No'}
                    </Text>
                  </VStack>
                </SimpleGrid>
              </Box>
            )}

            {/* Botones de acción */}
            <HStack spacing={3} justify="flex-end" pt={4}>
              <Button variant="outline" onClick={onCancel} disabled={isLoading} size="lg">
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading}
                loadingText={isEdit ? 'Actualizando...' : 'Registrando...'}
                disabled={!canSubmit}
                leftIcon={<Icon as={FiCheck} />}
                size="lg"
              >
                {isEdit ? 'Actualizar Recurso' : 'Registrar Recurso'}
              </Button>
            </HStack>
          </VStack>
        </form>
      </CardBody>
    </Card>
  );
}