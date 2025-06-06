// src/components/inventory/ResourceForm/ISBNValidationField.tsx
'use client';

import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Icon,
  Text,
  Button,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { UseFormReturn } from 'react-hook-form';
import { FiBook, FiCheck, FiX, FiExternalLink } from 'react-icons/fi';
import { SafeLink } from '@/components/ui/SafeLink';
import type { DynamicResourceFormData } from '@/lib/validation/resourceValidation';
import type { Resource } from '@/types/api.types';

interface ISBNValidationFieldProps {
  form: UseFormReturn<DynamicResourceFormData>;
  isbnValidation: {
    isValidating: boolean;
    hasConflict: boolean;
    existingResource: Resource | null;
    showValidation: boolean;
  };
  isRequired: boolean;
  isFromGoogleBooks: boolean;
}

/**
 * Subcomponente para validación de ISBN
 * Responsabilidad única: Validación y verificación de unicidad del ISBN
 */
export function ISBNValidationField({ 
  form, 
  isbnValidation,
  isRequired,
  isFromGoogleBooks
}: ISBNValidationFieldProps) {
  const { register, formState: { errors }, watch } = form;
  const { isValidating, hasConflict, existingResource, showValidation } = isbnValidation;
  
  const currentISBN = watch('isbn');

  const formatISBNDisplay = (isbn: string): string => {
    if (!isbn) return '';
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    if (cleanISBN.length === 13) {
      return `${cleanISBN.slice(0, 3)}-${cleanISBN.slice(3, 4)}-${cleanISBN.slice(4, 6)}-${cleanISBN.slice(6, 12)}-${cleanISBN.slice(12)}`;
    } else if (cleanISBN.length === 10) {
      return `${cleanISBN.slice(0, 1)}-${cleanISBN.slice(1, 6)}-${cleanISBN.slice(6, 9)}-${cleanISBN.slice(9)}`;
    }
    
    return isbn;
  };

  const renderValidationStatus = () => {
    if (!showValidation) return null;

    if (isValidating) {
      return (
        <InputRightElement>
          <Spinner size="sm" color="blue.500" />
        </InputRightElement>
      );
    }

    if (hasConflict) {
      return (
        <InputRightElement>
          <Icon as={FiX} color="red.500" boxSize={5} />
        </InputRightElement>
      );
    }

    return (
      <InputRightElement>
        <Icon as={FiCheck} color="green.500" boxSize={5} />
      </InputRightElement>
    );
  };

  return (
    <Box>
      <FormControl isInvalid={!!errors.isbn} isRequired={isRequired}>
        <FormLabel>
          <HStack spacing={2}>
            <Icon as={FiBook} color="blue.500" />
            <Text>ISBN</Text>
            {isFromGoogleBooks && (
              <Badge colorScheme="green" size="sm">
                Google Books
              </Badge>
            )}
            {!isRequired && (
              <Badge colorScheme="gray" fontSize="xs">
                Opcional
              </Badge>
            )}
          </HStack>
        </FormLabel>
        
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            <Text fontSize="sm" color="gray.400" fontWeight="medium">
              ISBN
            </Text>
          </InputLeftElement>
          
          <Input
            {...register('isbn')}
            placeholder="978-84-376-0494-7 o 8437604947"
            type="text"
            autoComplete="off"
            disabled={isFromGoogleBooks}
            paddingLeft="60px"
          />
          
          {renderValidationStatus()}
        </InputGroup>
        
        <FormErrorMessage>{errors.isbn?.message}</FormErrorMessage>
        
        <FormHelperText>
          <VStack spacing={1} align="start">
            <Text>
              Código de identificación internacional para libros (10 o 13 dígitos)
            </Text>
            {currentISBN && currentISBN.length >= 10 && (
              <Text fontSize="sm" color="blue.600" fontWeight="medium">
                Formato: {formatISBNDisplay(currentISBN)}
              </Text>
            )}
          </VStack>
        </FormHelperText>
      </FormControl>

      {/* Validación de ISBN */}
      {showValidation && (
        <Box mt={4}>
          {isValidating && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Verificando ISBN...</AlertTitle>
              <AlertDescription fontSize="sm">
                Comprobando si este ISBN ya está registrado
              </AlertDescription>
            </Alert>
          )}

          {!isValidating && hasConflict && existingResource && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box flex={1}>
                <AlertTitle>ISBN ya registrado</AlertTitle>
                <AlertDescription fontSize="sm">
                  <VStack spacing={2} align="start" mt={2}>
                    <Text>
                      Este ISBN ya está registrado para: <strong>{existingResource.title}</strong>
                    </Text>
                    <SafeLink href={`/inventory/${existingResource._id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        leftIcon={<Icon as={FiExternalLink} />}
                      >
                        Ver recurso existente
                      </Button>
                    </SafeLink>
                  </VStack>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {!isValidating && !hasConflict && currentISBN && currentISBN.length >= 10 && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <AlertTitle>ISBN disponible</AlertTitle>
              <AlertDescription fontSize="sm">
                Este ISBN está disponible para registro
              </AlertDescription>
            </Alert>
          )}
        </Box>
      )}

      {/* Información adicional sobre ISBN */}
      {isRequired && (
        <Box 
          mt={4}
          p={3} 
          bg="blue.50" 
          borderRadius="md" 
          border="1px solid" 
          borderColor="blue.200"
        >
          <VStack spacing={2} align="start">
            <Text fontSize="sm" fontWeight="medium" color="blue.800">
              ¿Dónde encontrar el ISBN?
            </Text>
            <VStack spacing={1} align="start" fontSize="sm" color="blue.700">
              <Text>• En la página de derechos de autor (reverso de la portada)</Text>
              <Text>• En la contraportada del libro</Text>
              <Text>• Cerca del código de barras</Text>
              <Text>• En sitios web de librerías o editoriales</Text>
            </VStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
}