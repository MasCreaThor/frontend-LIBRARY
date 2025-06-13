// components/loans/CreateLoanForm/CreateLoanForm.tsx
'use client';

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
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Badge,
  Avatar,
  Box,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { PersonSearch } from '@/components/people';
import { ResourceSearch } from '@/components/resources';
import { Person } from '@/types/api.types';
import { Resource } from '@/types/resource.types';
import { CreateLoanRequest } from '@/types/loan.types';
import { FiUser, FiBook, FiAlertTriangle, FiCheck } from 'react-icons/fi';

interface CreateLoanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (loanData: CreateLoanRequest) => void;
  isLoading?: boolean;
}

export function CreateLoanForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateLoanFormProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardBg = useColorModeValue('gray.50', 'gray.700');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPerson) {
      newErrors.person = 'Debe seleccionar una persona';
    }

    if (!selectedResource) {
      newErrors.resource = 'Debe seleccionar un recurso';
    }

    if (!selectedResource?.available) {
      newErrors.resource = 'El recurso seleccionado no está disponible';
    }

    if (quantity < 1 || quantity > 5) {
      newErrors.quantity = 'La cantidad debe estar entre 1 y 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const loanData: CreateLoanRequest = {
      personId: selectedPerson!._id,
      resourceId: selectedResource!._id,
      quantity,
      observations: observations.trim() || undefined,
    };

    onSubmit(loanData);
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedPerson(null);
      setSelectedResource(null);
      setQuantity(1);
      setObservations('');
      setErrors({});
      onClose();
    }
  };

  const canSubmit = selectedPerson && selectedResource && selectedResource.available && !isLoading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Crear Nuevo Préstamo</ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Selección de persona */}
            <FormControl isInvalid={!!errors.person}>
              <FormLabel>Persona</FormLabel>
              <PersonSearch
                onSelect={setSelectedPerson}
                placeholder="Buscar estudiante o docente..."
                isDisabled={isLoading}
                filterActive={true}
              />
              <FormErrorMessage>{errors.person}</FormErrorMessage>
            </FormControl>

            {/* Información de la persona seleccionada */}
            {selectedPerson && (
              <Box bg={cardBg} p={4} borderRadius="md">
                <HStack spacing={3}>
                  <Avatar size="sm" name={selectedPerson.fullName || `${selectedPerson.firstName} ${selectedPerson.lastName}`} />
                  <VStack spacing={0} align="start" flex={1}>
                    <Text fontWeight="bold">{selectedPerson.fullName || `${selectedPerson.firstName} ${selectedPerson.lastName}`}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedPerson.documentNumber} • {selectedPerson.grade}
                    </Text>
                  </VStack>
                  <Badge 
                    colorScheme={selectedPerson.active ? 'green' : 'red'}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    {selectedPerson.active ? <FiCheck size={12} /> : <FiAlertTriangle size={12} />}
                    {selectedPerson.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </HStack>
              </Box>
            )}

            {/* Selección de recurso */}
            <FormControl isInvalid={!!errors.resource}>
              <FormLabel>Recurso</FormLabel>
              <ResourceSearch
                onSelect={setSelectedResource}
                placeholder="Buscar libro o recurso..."
                isDisabled={isLoading}
                filterAvailable
              />
              <FormErrorMessage>{errors.resource}</FormErrorMessage>
            </FormControl>

            {/* Información del recurso seleccionado */}
            {selectedResource && (
              <Box bg={cardBg} p={4} borderRadius="md">
                <HStack spacing={3} align="start">
                  <FiBook size={20} />
                  <VStack spacing={1} align="start" flex={1}>
                    <Text fontWeight="bold">{selectedResource.title}</Text>
                    {selectedResource.authors && selectedResource.authors.length > 0 && (
                      <Text fontSize="sm" color="gray.600">
                        {selectedResource.authors.map(a => a.name).join(', ')}
                      </Text>
                    )}
                    {selectedResource.isbn && (
                      <Text fontSize="xs" color="gray.500" fontFamily="mono">
                        ISBN: {selectedResource.isbn}
                      </Text>
                    )}
                  </VStack>
                  <Badge 
                    colorScheme={selectedResource.available ? 'green' : 'red'}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    {selectedResource.available ? 'Disponible' : 'No disponible'}
                  </Badge>
                </HStack>

                {!selectedResource.available && (
                  <Alert status="error" mt={3} size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">Este recurso no está disponible para préstamo</Text>
                  </Alert>
                )}
              </Box>
            )}

            {/* Cantidad */}
            <FormControl isInvalid={!!errors.quantity}>
              <FormLabel>Cantidad</FormLabel>
              <NumberInput
                value={quantity}
                onChange={(_, value) => setQuantity(value || 1)}
                min={1}
                max={5}
                isDisabled={isLoading}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.quantity}</FormErrorMessage>
            </FormControl>

            {/* Observaciones */}
            <FormControl>
              <FormLabel>Observaciones (opcional)</FormLabel>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Agregar observaciones sobre el préstamo..."
                rows={3}
                isDisabled={isLoading}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={handleClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            isDisabled={!canSubmit}
            loadingText="Creando préstamo..."
          >
            Crear Préstamo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}