// src/app/admin/categories/page.tsx
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
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiGrid, FiPlus } from 'react-icons/fi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryList, CategoryForm } from '@/components/admin/categories';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/services/category.service';

export default function CategoriesPage() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Modales
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const handleCreateCategory = async (data: CreateCategoryRequest) => {
    try {
      await createMutation.mutateAsync(data);
      onCreateClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handleUpdateCategory = async (data: UpdateCategoryRequest) => {
    if (!editingCategory) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingCategory._id,
        data,
      });
      setEditingCategory(null);
      onEditClose();
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    onEditOpen();
  };

  const handleCloseEdit = () => {
    setEditingCategory(null);
    onEditClose();
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminRoute>
      <DashboardLayout>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="start" mb={4}>
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Box p={2} bg="blue.50" borderRadius="lg">
                    <FiGrid size={24} color="#3182CE" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="lg" color="gray.800">
                      Gestión de Categorías
                    </Heading>
                    <Text color="gray.600">
                      Organiza y clasifica los recursos de la biblioteca
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="lg"
                onClick={onCreateOpen}
                isDisabled={isMutating}
              >
                Nueva Categoría
              </Button>
            </HStack>
          </Box>

          {/* Lista de Categorías */}
          <Box>
            <CategoryList
              showActions={true}
              onCategoryEdit={handleCategoryEdit}
            />
          </Box>

          {/* Modal para crear categoría */}
          <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="md">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Nueva Categoría</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <CategoryForm
                  onSubmit={handleCreateCategory}
                  onCancel={onCreateClose}
                  isLoading={createMutation.isPending}
                />
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Modal para editar categoría */}
          <Modal isOpen={isEditOpen} onClose={handleCloseEdit} size="md">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Editar Categoría</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <CategoryForm
                  category={editingCategory}
                  onSubmit={handleUpdateCategory}
                  onCancel={handleCloseEdit}
                  isLoading={updateMutation.isPending}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </DashboardLayout>
    </AdminRoute>
  );
}