// src/components/loans/CreateLoanModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge,
  Spinner,
  useToast,
  useColorModeValue,
  Collapse,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';

import { 
  FiSave, 
  FiRefreshCw, 
  FiUser, 
  FiBook, 
  FiCalendar,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX
} from 'react-icons/fi';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';

// Importar componentes y hooks
import PersonSearchInput from '@/components/shared/PersonSearchInput/PersonSearchInput';
import ResourceSearchInput from '@/components/shared/ResourceSearchInput/ResourceSearchInput';
import { useLoans } from '@/hooks/useLoans';
import { useLoanValidation, useRealtimeLoanValidation } from '@/hooks/useLoanValidation';
import type { Person, Resource } from '@/types/api.types';
import type { CreateLoanRequest, LoanWithDetails } from '@/types/loan.types';

// ===== ESQUEMA DE VALIDACIÓN =====

const createLoanSchema = z.object({
  personId: z.string().min(1, 'Debe seleccionar una persona'),
  resourceId: z.string().min(1, 'Debe seleccionar un recurso'),
  quantity: z.number()
    .min(1, 'La cantidad debe ser mayor a 0')
    .max(50, 'Cantidad máxima: 50'),
  observations: z.string()
    .max(500, 'Las observaciones no deben exceder 500 caracteres')
    .optional()
});

type CreateLoanFormData = z.infer<typeof createLoanSchema>;

// ===== INTERFACES =====

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (loan: LoanWithDetails) => void;
}

// ===== COMPONENTE PRINCIPAL =====

const CreateLoanModal: React.FC<CreateLoanModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const toast = useToast();
  
  // Estados locales
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { createLoan } = useLoans();
  const { 
    isValid, 
    validationErrors, 
    validationWarnings, 
    loading: validating, 
    validateLoan, 
    clearValidation,
    lastValidation 
  } = useLoanValidation();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Form
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<CreateLoanFormData>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      quantity: 1
    }
  });

  const watchedValues = watch();

  // Validación en tiempo real
  const realtimeValidation = useRealtimeLoanValidation(
    selectedPerson?._id,
    selectedResource?._id,
    watchedValues.quantity,
    !!(selectedPerson && selectedResource && watchedValues.quantity)
  );

  // ===== EFECTOS =====

  useEffect(() => {
    if (isOpen) {
      // Resetear todo cuando se abre el modal
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    // Actualizar los IDs en el formulario cuando se seleccionan persona/recurso
    if (selectedPerson) {
      setValue('personId', selectedPerson._id);
    }
    if (selectedResource) {
      setValue('resourceId', selectedResource._id);
    }
  }, [selectedPerson, selectedResource, setValue]);

  // ===== FUNCIONES =====

  const resetForm = () => {
    reset();
    setSelectedPerson(null);
    setSelectedResource(null);
    clearValidation();
    setIsSubmitting(false);
  };

  const handlePersonSelect = (person: Person | null) => {
    setSelectedPerson(person);
    if (person) {
      setValue('personId', person._id);
    } else {
      setValue('personId', '');
    }
    clearValidation();
  };

  const handleResourceSelect = (resource: Resource | null) => {
    setSelectedResource(resource);
    if (resource) {
      setValue('resourceId', resource._id);
    } else {
      setValue('resourceId', '');
    }
    clearValidation();
  };

  const handleQuantityChange = (valueString: string, valueNumber: number) => {
    setValue('quantity', valueNumber);
    clearValidation();
  };

  const onSubmit = async (data: CreateLoanFormData) => {
    if (!selectedPerson || !selectedResource) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar una persona y un recurso',
        status: 'error',
        duration: 4000,
      });
      return;
    }

    // Validar antes de enviar
    if (!realtimeValidation.isValid && realtimeValidation.errors.length > 0) {
      toast({
        title: 'Validación fallida',
        description: 'Por favor, corrija los errores antes de continuar',
        status: 'error',
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const loanData: CreateLoanRequest = {
        personId: data.personId,
        resourceId: data.resourceId,
        quantity: data.quantity,
        observations: data.observations?.trim() || undefined
      };

      const newLoan = await createLoan(loanData);

      toast({
        title: 'Préstamo creado exitosamente',
        description: `Préstamo registrado para ${selectedPerson.fullName || `${selectedPerson.firstName} ${selectedPerson.lastName}`}`,
        status: 'success',
        duration: 5000,
      });

      onSuccess?.(newLoan);
      handleClose();

    } catch (error: any) {
      console.error('Error creating loan:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al crear el préstamo';
      
      toast({
        title: 'Error al crear préstamo',
        description: errorMessage,
        status: 'error',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  // Calcular fecha de vencimiento (15 días por defecto)
  const calculateDueDate = () => {
    return format(addDays(new Date(), 15), 'dd/MM/yyyy');
  };

  // Determinar si el botón de envío debe estar habilitado
  const isSubmitDisabled = !selectedPerson || 
                          !selectedResource || 
                          !watchedValues.quantity || 
                          watchedValues.quantity < 1 ||
                          isSubmitting ||
                          realtimeValidation.isValidating ||
                          (realtimeValidation.validation && !realtimeValidation.isValid);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="xl" 
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
    >
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <HStack>
            <FiBook />
            <Text>Registrar Nuevo Préstamo</Text>
          </HStack>
        </ModalHeader>
        
        {!isSubmitting && <ModalCloseButton />}

        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              
              {/* Selección de Persona */}
              <FormControl isInvalid={!!errors.personId} isRequired>
                <FormLabel>
                  <HStack>
                    <FiUser />
                    <Text>Persona</Text>
                  </HStack>
                </FormLabel>
                <PersonSearchInput
                  onPersonSelected={handlePersonSelect}
                  selectedPerson={selectedPerson}
                  placeholder="Buscar por nombre, apellido o documento..."
                  error={errors.personId?.message}
                  isDisabled={isSubmitting}
                />
                <FormHelperText>
                  Busque y seleccione la persona que tomará el préstamo
                </FormHelperText>
              </FormControl>

              {/* Información de la persona seleccionada */}
              {selectedPerson && (
                <Box p={3} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="md">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text fontWeight="bold">
                        {selectedPerson.fullName || `${selectedPerson.firstName} ${selectedPerson.lastName}`}
                      </Text>
                      {selectedPerson.personType && (
                        <Badge colorScheme={selectedPerson.personType.name === 'student' ? 'blue' : 'purple'}>
                          {selectedPerson.personType.name === 'student' ? 'Estudiante' : 'Profesor'}
                        </Badge>
                      )}
                    </HStack>
                    {selectedPerson.documentNumber && (
                      <Text fontSize="sm" color="gray.600">
                        Documento: {selectedPerson.documentNumber}
                      </Text>
                    )}
                    {selectedPerson.grade && (
                      <Text fontSize="sm" color="gray.600">
                        Grado: {selectedPerson.grade}
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}

              <Divider />

              {/* Selección de Recurso */}
              <FormControl isInvalid={!!errors.resourceId} isRequired>
                <FormLabel>
                  <HStack>
                    <FiBook />
                    <Text>Recurso</Text>
                  </HStack>
                </FormLabel>
                <ResourceSearchInput
                  onResourceSelected={handleResourceSelect}
                  selectedResource={selectedResource}
                  placeholder="Buscar por título, autor o ISBN..."
                  error={errors.resourceId?.message}
                  isDisabled={isSubmitting}
                  availableOnly={true}
                  showStock={true}
                />
                <FormHelperText>
                  Busque y seleccione el recurso a prestar
                </FormHelperText>
              </FormControl>

              {/* Información del recurso seleccionado */}
              {selectedResource && (
                <Box p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">{selectedResource.title}</Text>
                    {selectedResource.authors && (
                      <Text fontSize="sm" color="gray.600">
                        Autor: {selectedResource.authors}
                      </Text>
                    )}
                    <HStack spacing={4}>
                      {selectedResource.isbn && (
                        <Text fontSize="sm" color="gray.600">
                          ISBN: {selectedResource.isbn}
                        </Text>
                      )}
                      {selectedResource.totalQuantity && (
                        <Text fontSize="sm" color="gray.600">
                          Stock total: {selectedResource.totalQuantity}
                        </Text>
                      )}
                      {selectedResource.currentLoansCount !== undefined && (
                        <Text fontSize="sm" color="gray.600">
                          En préstamo: {selectedResource.currentLoansCount}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </Box>
              )}

              <Divider />

              {/* Cantidad */}
              <FormControl isInvalid={!!errors.quantity} isRequired>
                <FormLabel>Cantidad</FormLabel>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      {...field}
                      min={1}
                      max={50}
                      isDisabled={isSubmitting}
                      onChange={handleQuantityChange}
                      value={field.value || 1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  )}
                />
                <FormErrorMessage>{errors.quantity?.message}</FormErrorMessage>
                <FormHelperText>
                  Cantidad de unidades a prestar (máximo 50)
                </FormHelperText>
              </FormControl>

              {/* Observaciones */}
              <FormControl isInvalid={!!errors.observations}>
                <FormLabel>Observaciones (opcional)</FormLabel>
                <Textarea
                  {...register('observations')}
                  placeholder="Observaciones adicionales sobre el préstamo..."
                  isDisabled={isSubmitting}
                  resize="vertical"
                  rows={3}
                />
                <FormErrorMessage>{errors.observations?.message}</FormErrorMessage>
              </FormControl>

              {/* Información de fecha de vencimiento */}
              <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                <HStack>
                  <FiCalendar />
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="bold">Fecha de vencimiento:</Text>{' '}
                    {calculateDueDate()} (15 días)
                  </Text>
                </HStack>
              </Box>

              {/* Validaciones en tiempo real */}
              {realtimeValidation.isValidating && (
                <Alert status="info">
                  <Spinner size="sm" mr={2} />
                  <AlertDescription>Validando préstamo...</AlertDescription>
                </Alert>
              )}

              {/* Errores de validación */}
              {realtimeValidation.errors.length > 0 && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Errores encontrados:</AlertTitle>
                    <AlertDescription>
                      <List spacing={1} mt={2}>
                        {realtimeValidation.errors.map((error, index) => (
                          <ListItem key={index} fontSize="sm">
                            <ListIcon as={FiX} color="red.500" />
                            {error}
                          </ListItem>
                        ))}
                      </List>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Advertencias de validación */}
              {realtimeValidation.warnings.length > 0 && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Advertencias:</AlertTitle>
                    <AlertDescription>
                      <List spacing={1} mt={2}>
                        {realtimeValidation.warnings.map((warning, index) => (
                          <ListItem key={index} fontSize="sm">
                            <ListIcon as={FiInfo} color="orange.500" />
                            {warning}
                          </ListItem>
                        ))}
                      </List>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Validación exitosa */}
              {realtimeValidation.isValid && selectedPerson && selectedResource && (
                <Alert status="success">
                  <AlertIcon />
                  <AlertDescription>
                    ✅ El préstamo puede ser registrado sin problemas
                  </AlertDescription>
                </Alert>
              )}

            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={handleClose}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              onClick={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              loadingText="Creando préstamo..."
              leftIcon={<FiSave />}
              isDisabled={isSubmitDisabled}
            >
              Registrar Préstamo
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateLoanModal;