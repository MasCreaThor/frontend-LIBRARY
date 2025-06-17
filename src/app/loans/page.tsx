'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  LoanList, 
  LoanFilters, 
  CreateLoanModal,
  LoanStatistics 
} from '@/components/loans';
import { useState } from 'react';
import { VStack, HStack, Button, Heading } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';

export default function LoansPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Gestión de Préstamos</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Préstamo
          </Button>
        </HStack>

        <LoanStatistics />
        
        <LoanFilters />
        
        <LoanList />

        <CreateLoanModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            // Refrescar lista de préstamos
          }}
        />
      </VStack>
    </DashboardLayout>
  );
}