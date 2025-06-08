// src/app/admin/locations/page.tsx
'use client';

import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiMapPin, FiPlus, FiBarChart } from 'react-icons/fi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LocationList, LocationForm } from '@/components/admin/locations';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { useCreateLocation, useUpdateLocation, useLocationStats } from '@/hooks/useLocations';
import type { Location, CreateLocationRequest, UpdateLocationRequest } from '@/services/location.service';

export default function LocationsPage() {
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const { data: stats } = useLocationStats();

  const handleCreateLocation = async (data: CreateLocationRequest) => {
    try {
      await createMutation.mutateAsync(data);
      onCreateClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handleUpdateLocation = async (data: UpdateLocationRequest) => {
    if (!editingLocation) return;
    
    try {
      await updateMutation.mutateAsync({ id: editingLocation._id, data });
      setEditingLocation(null);
      onEditClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handleLocationEdit = (location: Location) => {
    setEditingLocation(location);
    onEditOpen();
  };

  const handleCloseEdit = () => {
    setEditingLocation(null);
    onEditClose();
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminRoute>
      <DashboardLayout>
        <VStack spacing={6} align="stretch">
          <Box>
            <HStack justify="space-between" align="start" mb={4}>
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Box p={2} bg="green.50" borderRadius="lg">
                    <FiMapPin size={24} color="#38A169" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="lg" color="gray.800">
                      Gestión de Ubicaciones
                    </Heading>
                    <Text color="gray.600">
                      Administra las ubicaciones físicas de los recursos
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              <Button
                leftIcon={<FiPlus />}
                colorScheme="green"
                size="lg"
                onClick={onCreateOpen}
                isDisabled={isMutating}
              >
                Nueva Ubicación
              </Button>
            </HStack>
          </Box>

          {stats && (
            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <Text fontWeight="medium" color="gray.700">Estadísticas de Ubicaciones</Text>
                <Icon as={FiBarChart} color="gray.500" />
              </HStack>
              
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Card size="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Total</StatLabel>
                      <StatNumber fontSize="2xl">{stats.total}</StatNumber>
                      <StatHelpText fontSize="xs">ubicaciones registradas</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card size="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Activas</StatLabel>
                      <StatNumber fontSize="2xl" color="green.600">{stats.active}</StatNumber>
                      <StatHelpText fontSize="xs">en uso</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card size="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Inactivas</StatLabel>
                      <StatNumber fontSize="2xl" color="gray.500">{stats.inactive}</StatNumber>
                      <StatHelpText fontSize="xs">deshabilitadas</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card size="sm">
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="xs">Con Recursos</StatLabel>
                      <StatNumber fontSize="2xl" color="green.600">
                        {Object.keys(stats.resourceCount).length}
                      </StatNumber>
                      <StatHelpText fontSize="xs">tienen recursos</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>
          )}

          <LocationList
            onLocationEdit={handleLocationEdit}
            onCreate={onCreateOpen}
            showActions={true}
          />
        </VStack>

        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <Icon as={FiMapPin} color="green.500" />
                <Text>Nueva Ubicación</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <LocationForm
                onSubmit={handleCreateLocation}
                onCancel={onCreateClose}
                isLoading={createMutation.isPending}
                isEdit={false}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        <Modal isOpen={isEditOpen} onClose={handleCloseEdit} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <Icon as={FiMapPin} color="green.500" />
                <Text>Editar Ubicación</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {editingLocation && (
                <LocationForm
                  location={editingLocation}
                  onSubmit={handleUpdateLocation}
                  onCancel={handleCloseEdit}
                  isLoading={updateMutation.isPending}
                  isEdit={true}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </DashboardLayout>
    </AdminRoute>
  );
}