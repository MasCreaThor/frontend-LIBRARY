'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Heading,
  useDisclosure
} from '@chakra-ui/react';

import { FiPlus } from 'react-icons/fi';

// Importar el layout y componentes existentes (NO CAMBIAR)
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoanManagement from '@/components/loans/LoanManagement';
import LoanStatistics from '@/components/loans/LoanStatistics';

// ← SOLO CAMBIAR ESTA LÍNEA: usar el modal mejorado
import CreateLoanModal from '@/components/loans/CreateLoanModal';

const LoansPage: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLoanCreated = (loan: any) => {
    console.log('Nuevo préstamo creado:', loan);
    // Aquí puedes actualizar estado, mostrar notificación, etc.
    // El resto de tu lógica existente NO CAMBIA
  };

  return (
    <DashboardLayout>
      <Box maxW="full" mx="auto" px={4} py={8}>
        <VStack spacing={8} align="stretch">
          
          {/* Header - NO CAMBIAR */}
          <HStack justify="space-between" align="center">
            <Heading size="lg" color="gray.700">
              Gestión de Préstamos
            </Heading>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={onOpen}
              size="md"
            >
              Nuevo Préstamo
            </Button>
          </HStack>

          {/* Componentes existentes - NO CAMBIAR */}
          <LoanStatistics />
          <LoanManagement />

          {/* ← SOLO ESTE MODAL CAMBIÓ - Ahora tiene búsquedas mejoradas */}
          <CreateLoanModal 
            isOpen={isOpen}
            onClose={onClose}
            onSuccess={handleLoanCreated}
          />
        </VStack>
      </Box>
    </DashboardLayout>
  );
};

export default LoansPage;