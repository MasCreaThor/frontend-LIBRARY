// src/components/loans/CreateLoanModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  User,
  Book,
  Hash,
  FileText
} from 'lucide-react';

// Importar tipos y hooks
import type { CreateLoanRequest } from '@/types/loan.types';
import { useLoans, useValidation, useLoanForm } from '@/hooks/useLoans';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal para crear nuevos préstamos con validaciones
 * Ubicación: src/components/loan/CreateLoanModal.tsx
 */
const CreateLoanModal: React.FC<CreateLoanModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [step, setStep] = useState(1); // 1: Datos básicos, 2: Validación, 3: Confirmación
  const [validationResult, setValidationResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Hooks personalizados
  const { createLoan } = useLoans();
  const { validateLoan, loading: validating } = useValidation();
  const { 
    formData, 
    errors, 
    isValid, 
    updateField, 
    validateForm, 
    resetForm 
  } = useLoanForm();

  // Mock data - En producción estos vendrían de APIs
  const mockPersons = [
    { _id: '1', fullName: 'Juan Pérez', documentNumber: '12345678', grade: '5to A', personType: 'student' },
    { _id: '2', fullName: 'María González', documentNumber: '87654321', grade: '3ro B', personType: 'student' },
    { _id: '3', fullName: 'Prof. Carlos López', documentNumber: '11111111', grade: 'N/A', personType: 'teacher' }
  ];

  const mockResources = [
    { _id: '1', title: 'Matemáticas Básicas', author: 'Editorial Santillana', availableQuantity: 5, totalQuantity: 10 },
    { _id: '2', title: 'Historia Universal', author: 'McGraw Hill', availableQuantity: 2, totalQuantity: 8 },
    { _id: '3', title: 'Ciencias Naturales', author: 'Editorial Norma', availableQuantity: 8, totalQuantity: 12 }
  ];

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setValidationResult(null);
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleNext = async () => {
    if (step === 1) {
      if (!validateForm()) return;
      
      // Validar con el backend
      try {
        const result = await validateLoan(formData as CreateLoanRequest);
        setValidationResult(result);
        setStep(2);
      } catch (error) {
        console.error('Error en validación:', error);
        alert('Error al validar el préstamo');
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validationResult?.isValid) return;
    
    setSubmitting(true);
    try {
      await createLoan(formData as CreateLoanRequest);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error al crear préstamo:', error);
      alert('Error al crear el préstamo');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedPerson = () => {
    return mockPersons.find(p => p._id === formData.personId);
  };

  const getSelectedResource = () => {
    return mockResources.find(r => r._id === formData.resourceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Book className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Crear Nuevo Préstamo
              </h3>
              <p className="text-sm text-gray-500">
                Paso {step} de 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`ml-4 h-1 w-16 rounded ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Datos básicos</span>
            <span>Validación</span>
            <span>Confirmación</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Paso 1: Datos Básicos */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Selección de Persona */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Persona *
                </label>
                <select
                  value={formData.personId || ''}
                  onChange={(e) => updateField('personId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.personId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar persona...</option>
                  {mockPersons.map(person => (
                    <option key={person._id} value={person._id}>
                      {person.fullName} - {person.documentNumber} 
                      ({person.personType === 'student' ? 'Estudiante' : 'Profesor'})
                    </option>
                  ))}
                </select>
                {errors.personId && (
                  <p className="mt-1 text-sm text-red-600">{errors.personId}</p>
                )}
              </div>

              {/* Selección de Recurso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Book className="inline h-4 w-4 mr-1" />
                  Recurso *
                </label>
                <select
                  value={formData.resourceId || ''}
                  onChange={(e) => updateField('resourceId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.resourceId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar recurso...</option>
                  {mockResources.map(resource => (
                    <option key={resource._id} value={resource._id}>
                      {resource.title} - {resource.author} 
                      ({resource.availableQuantity} disponibles)
                    </option>
                  ))}
                </select>
                {errors.resourceId && (
                  <p className="mt-1 text-sm text-red-600">{errors.resourceId}</p>
                )}
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="inline h-4 w-4 mr-1" />
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.quantity || 1}
                  onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Máximo 50 unidades por préstamo
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={formData.observations || ''}
                  onChange={(e) => updateField('observations', e.target.value)}
                  placeholder="Observaciones adicionales sobre el préstamo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Máximo 500 caracteres
                </p>
              </div>
            </div>
          )}

          {/* Paso 2: Validación */}
          {step === 2 && validationResult && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Resultado de la Validación
                </h4>
              </div>

              {/* Estado General */}
              <div className={`p-4 rounded-lg border ${
                validationResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    validationResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validationResult.isValid ? 'Préstamo válido' : 'Préstamo no válido'}
                  </span>
                </div>
              </div>

              {/* Errores */}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-800 mb-2">Errores encontrados:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="text-red-700 text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advertencias */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2">Advertencias:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-700 text-sm">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Información Detallada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 mb-2">Información de Persona</h5>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>Puede prestar: {validationResult.personInfo.canBorrow ? 'Sí' : 'No'}</p>
                    <p>Préstamos activos: {validationResult.personInfo.activeLoans}</p>
                    <p>Máximo permitido: {validationResult.personInfo.maxLoans}</p>
                    <p>Tipo: {validationResult.personInfo.personType}</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">Información de Recurso</h5>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>Disponible: {validationResult.resourceInfo.available ? 'Sí' : 'No'}</p>
                    <p>Cantidad total: {validationResult.resourceInfo.totalQuantity}</p>
                    <p>Prestados actualmente: {validationResult.resourceInfo.currentLoans}</p>
                    <p>Disponibles: {validationResult.resourceInfo.availableQuantity}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="font-medium text-purple-800 mb-2">Información de Cantidad</h5>
                <div className="space-y-1 text-sm text-purple-700">
                  <p>Cantidad solicitada: {validationResult.quantityInfo.requested}</p>
                  <p>Máximo permitido: {validationResult.quantityInfo.maxAllowed}</p>
                  <p>Razón: {validationResult.quantityInfo.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Confirmar Préstamo
                </h4>
                <p className="text-gray-600">
                  Revisa los datos antes de crear el préstamo
                </p>
              </div>

              {/* Resumen del Préstamo */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4">Resumen del Préstamo</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Persona</h6>
                    <div className="text-sm text-gray-600">
                      <p>{getSelectedPerson()?.fullName}</p>
                      <p>{getSelectedPerson()?.documentNumber}</p>
                      <p className="capitalize">
                        {getSelectedPerson()?.personType === 'student' ? 'Estudiante' : 'Profesor'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h6 className="font-medium text-gray-700 mb-2">Recurso</h6>
                    <div className="text-sm text-gray-600">
                      <p>{getSelectedResource()?.title}</p>
                      <p>{getSelectedResource()?.author}</p>
                      <p>Cantidad: {formData.quantity}</p>
                    </div>
                  </div>
                </div>

                {formData.observations && (
                  <div className="mt-4">
                    <h6 className="font-medium text-gray-700 mb-2">Observaciones</h6>
                    <p className="text-sm text-gray-600">{formData.observations}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <p><strong>Fecha de préstamo:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                    <p><strong>Fecha de vencimiento:</strong> {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Anterior
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!isValid || validating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {validating && <RefreshCw className="h-4 w-4 animate-spin" />}
                <span>{step === 1 ? 'Validar' : 'Siguiente'}</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validationResult?.isValid || submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Creando...' : 'Crear Préstamo'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLoanModal;