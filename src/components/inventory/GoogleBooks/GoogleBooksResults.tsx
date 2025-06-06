// src/components/inventory/GoogleBooks/GoogleBooksResults.tsx
'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Image,
  Grid,
  GridItem,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Collapse,
  useDisclosure,
  Divider,
} from '@chakra-ui/react';
import { useState } from 'react';
import { 
  FiBook, 
  FiUser, 
  FiCalendar, 
  FiBarcode,
  FiExternalLink,
  FiPlus,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiCheck
} from 'react-icons/fi';
import { GoogleBooksService } from '@/services/googleBooks.service';
import type { GoogleBooksVolumeDto } from '@/services/googleBooks.service';

interface GoogleBooksResultsProps {
  results: GoogleBooksVolumeDto[];
  onSelect: (book: GoogleBooksVolumeDto) => void;
  onManualEntry: () => void;
  searchStrategy: string;
}

interface BookCardProps {
  book: GoogleBooksVolumeDto;
  onSelect: (book: GoogleBooksVolumeDto) => void;
}

/**
 * Componente para una tarjeta individual de libro
 */
function BookCard({ book, onSelect }: BookCardProps) {
  const { isOpen: isExpanded, onToggle } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const imageUrl = GoogleBooksService.getBestImageUrl(book.imageLinks);
  const isbn = GoogleBooksService.extractISBN(book.industryIdentifiers);
  const appropriatenessCheck = GoogleBooksService.isSchoolAppropriate(book);
  const publishedDate = GoogleBooksService.parsePublicationDate(book.publishedDate);

  const handleSelect = () => {
    onSelect(book);
  };

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      shadow="sm"
      _hover={{ shadow: 'md', borderColor: 'blue.300' }}
      transition="all 0.2s"
    >
      <Grid templateColumns={{ base: '1fr', md: 'auto 1fr auto' }} gap={4} alignItems="start">
        {/* Imagen del libro */}
        <GridItem>
          <Box
            w="80px"
            h="120px"
            bg="gray.100"
            borderRadius="md"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={book.title}
                w="full"
                h="full"
                objectFit="cover"
                fallback={
                  <Icon as={FiBook} boxSize={8} color="gray.400" />
                }
              />
            ) : (
              <Icon as={FiBook} boxSize={8} color="gray.400" />
            )}
          </Box>
        </GridItem>

        {/* Información del libro */}
        <GridItem>
          <VStack spacing={2} align="start">
            <VStack spacing={1} align="start">
              <Text fontWeight="bold" fontSize="lg" color="gray.800" noOfLines={2}>
                {book.title}
              </Text>
              
              {book.authors && book.authors.length > 0 && (
                <HStack spacing={1} wrap="wrap">
                  <Icon as={FiUser} color="gray.500" boxSize={4} />
                  <Text fontSize="sm" color="gray.600">
                    {book.authors.join(', ')}
                  </Text>
                </HStack>
              )}
            </VStack>

            <HStack spacing={4} wrap="wrap">
              {book.publisher && (
                <Text fontSize="sm" color="gray.600">
                  <strong>Editorial:</strong> {book.publisher}
                </Text>
              )}
              
              {publishedDate && (
                <HStack spacing={1}>
                  <Icon as={FiCalendar} color="gray.500" boxSize={3} />
                  <Text fontSize="sm" color="gray.600">
                    {publishedDate.getFullYear()}
                  </Text>
                </HStack>
              )}
              
              {isbn && (
                <HStack spacing={1}>
                  <Icon as={FiBarcode} color="gray.500" boxSize={3} />
                  <Text fontSize="sm" color="gray.600" fontFamily="mono">
                    {isbn}
                  </Text>
                </HStack>
              )}
            </HStack>

            {/* Categorías */}
            {book.categories && book.categories.length > 0 && (
              <HStack spacing={1} wrap="wrap">
                {book.categories.slice(0, 3).map((category, index) => (
                  <Badge key={index} colorScheme="purple" variant="subtle" fontSize="xs">
                    {category}
                  </Badge>
                ))}
                {book.categories.length > 3 && (
                  <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                    +{book.categories.length - 3}
                  </Badge>
                )}
              </HStack>
            )}

            {/* Indicador de apropiado para escuela */}
            <HStack spacing={2}>
              {appropriatenessCheck.appropriate ? (
                <Badge colorScheme="green" variant="subtle" fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={FiCheck} boxSize={3} />
                    <Text>Apropiado para escuela</Text>
                  </HStack>
                </Badge>
              ) : (
                <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={FiAlertTriangle} boxSize={3} />
                    <Text>Revisar contenido</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>

            {/* Descripción expandible */}
            {book.description && (
              <Box w="full">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={onToggle}
                  rightIcon={<Icon as={isExpanded ? FiChevronUp : FiChevronDown} />}
                  color="blue.600"
                >
                  {isExpanded ? 'Ocultar' : 'Ver'} descripción
                </Button>
                
                <Collapse in={isExpanded} animateOpacity>
                  <Text 
                    fontSize="sm" 
                    color="gray.600" 
                    mt={2} 
                    noOfLines={isExpanded ? undefined : 3}
                  >
                    {book.description}
                  </Text>
                </Collapse>
              </Box>
            )}
          </VStack>
        </GridItem>

        {/* Acciones */}
        <GridItem>
          <VStack spacing={2}>
            <Button
              colorScheme="green"
              size="sm"
              leftIcon={<Icon as={FiPlus} />}
              onClick={handleSelect}
              w="full"
            >
              Seleccionar
            </Button>
            
            {book.previewLink && (
              <Tooltip label="Ver vista previa en Google Books">
                <Button
                  as="a"
                  href={book.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  variant="outline"
                  leftIcon={<Icon as={FiExternalLink} />}
                  w="full"
                >
                  Vista previa
                </Button>
              </Tooltip>
            )}
          </VStack>
        </GridItem>
      </Grid>

      {/* Advertencias de contenido */}
      {!appropriatenessCheck.appropriate && (
        <Alert status="warning" size="sm" borderRadius="md" mt={3}>
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Revisar contenido</AlertTitle>
            <AlertDescription fontSize="xs">
              {appropriatenessCheck.reasons.join('. ')}
            </AlertDescription>
          </Box>
        </Alert>
      )}
    </Box>
  );
}

/**
 * Componente principal para mostrar resultados de Google Books
 */
export function GoogleBooksResults({ 
  results, 
  onSelect, 
  onManualEntry,
  searchStrategy 
}: GoogleBooksResultsProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedResults = showAll ? results : results.slice(0, 5);
  const hasMore = results.length > 5;

  if (results.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>No se encontraron resultados</AlertTitle>
          <AlertDescription fontSize="sm">
            No se encontraron libros con los criterios de búsqueda. 
            Intenta con otros términos o usa el registro manual.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header de resultados */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            Resultados de Google Books
          </Text>
          <HStack spacing={2}>
            <Text fontSize="sm" color="gray.600">
              {results.length} libro{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </Text>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              Estrategia: {searchStrategy}
            </Badge>
          </HStack>
        </VStack>

        <Button
          variant="outline"
          size="sm"
          onClick={onManualEntry}
        >
          Registro Manual
        </Button>
      </HStack>

      {/* Lista de resultados */}
      <VStack spacing={4} align="stretch">
        {displayedResults.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onSelect={onSelect}
          />
        ))}
      </VStack>

      {/* Botón para mostrar más */}
      {hasMore && (
        <Box textAlign="center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            leftIcon={<Icon as={showAll ? FiChevronUp : FiChevronDown} />}
          >
            {showAll 
              ? 'Mostrar menos' 
              : `Ver ${results.length - 5} libro${results.length - 5 !== 1 ? 's' : ''} más`
            }
          </Button>
        </Box>
      )}

      <Divider />

      {/* Información adicional */}
      <Box 
        p={4} 
        bg="gray.50" 
        borderRadius="md" 
        border="1px solid" 
        borderColor="gray.200"
      >
        <HStack spacing={2} mb={2}>
          <Icon as={FiInfo} color="gray.500" />
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Sobre los resultados de Google Books
          </Text>
        </HStack>
        <VStack spacing={1} align="start" fontSize="sm" color="gray.600">
          <Text>• Los datos se completan automáticamente al seleccionar un libro</Text>
          <Text>• Puedes editar la información después de seleccionar</Text>
          <Text>• Si no encuentras el libro exacto, usa "Registro Manual"</Text>
          <Text>• Los libros marcados como "Revisar contenido" requieren evaluación adicional</Text>
        </VStack>
      </Box>
    </VStack>
  );
}