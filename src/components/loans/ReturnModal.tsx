import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Clock,
  User,
  Book,
  AlertCircle,
  FileText
} from 'lucide-react';

// Importar tipos y hooks
import type { LoanWithDetails, ReturnLoanRequest } from '@/types/loan.types';
import { useReturn } from '@/hooks/useLoans';
import { LoanService } from '@/services/loan.service';

interface ReturnModalProps {
  loan: LoanWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal para procesar devoluciones de préstamos
 * Ubicación: src/components/loan/ReturnModal.tsx
 */
const ReturnModal: React.FC<ReturnModalProps> = ({ 
  loan, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [returnData, setReturnData] = useState({
    returnDate: new Date().toISOString().split('T')[0],
    resourceCondition: 'good',
    returnObservations: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  
  const { processReturn, markAsLost } = useReturn();

  // Reset form cuando cambia el préstamo
  useEffect(() => {
    if (loan && isOpen) {
      setReturnData({
        returnDate: new Date().toISOString().split('T')[0],
        resourceCondition: 'good',
        returnObservations: ''
      });
      setErrors({});
    }
  }, [loan, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!returnData.returnDate) {
      newErrors.returnDate = 'La fecha de devolución es obligatoria';
    } else {
      const returnDate = new Date(returnData.returnDate);
      const loanDate = new Date(loan.loanDate);
      
      if (returnDate < loanDate) {
        newErrors.returnDate = 'La fecha de devolución no puede ser anterior a la fecha de préstamo';
      }
      
      if (returnDate > new Date()) {
        newErrors.returnDate = 'La fecha de devolución no puede ser futura';
      }
    }
    
    if (!returnData.resourceCondition) {
      newErrors.resourceCondition = 'Selecciona la condición del recurso';
    }
    
    if (returnData.returnObservations && returnData.returnObservations.length > 500) {
      newErrors.returnObservations = 'Las observaciones no pueden exceder 500 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReturn = async () => {
    if (!validateForm()) return;
    
    setProcessing(true);
    try {
      const requestData: ReturnLoanRequest = {
        loanId: loan._id,
        returnDate: returnData.returnDate,
        resourceCondition: returnData.resourceCondition,
        returnObservations: returnData.returnObservations.trim() || undefined
      };
      
      await processReturn(requestData);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error al procesar devolución:', error);
      setErrors({ general: error.message || 'Error al procesar la devolución' });
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsLost = async () => {
    if (!confirm(`¿Estás seguro de marcar el recurso "${loan.resource?.title}" como perdido? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setProcessing(true);
    try {
      await markAsLost(loan._id, {
        observations: `Recurso marcado como perdido. ${returnData.returnObservations}`.trim()
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error al marcar como perdido:', error);
      setErrors({ general: error.message || 'Error al marcar como perdido' });
    } finally {
      setProcessing(false);
    }
  };

  const calculateDaysOverdue = (): number => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    
    if (today <= dueDate) return 0;
    
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const daysOverdue = calculateDaysOverdue();
  const isOverdue = daysOverdue > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              isOverdue ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {isOverdue ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Procesar Devolución
              </h3>
              {isOverdue && (
                <p className="text-sm text-red-600">
                  ⚠️ Préstamo vencido - {daysOverdue} días de retraso
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error General */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Información del Préstamo */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Book className="h-5 w-5 mr-2" />
              Información del Préstamo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información de Persona */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {loan.person?.fullName || 'Persona no disponible'}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{loan.person?.documentNumber && `Doc: ${loan.person.documentNumber}`}</p>
                      <p>{loan.person?.grade && `Grado: ${loan.person.grade}`}</p>
                      {loan.person?.personType && (
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          loan.person.personType.name === 'student' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {loan.person.personType.name === 'student' ? 'Estudiante' : 'Profesor'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Recurso */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Book className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {loan.resource?.title || 'Recurso no disponible'}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{loan.resource?.author && `Autor: ${loan.resource.author}`}</p>
                      <p>Cantidad: {loan.quantity}</p>
                      {loan.resource?.isbn && <p>ISBN: {loan.resource.isbn}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fechas del Préstamo */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-gray-500">Fecha de préstamo</p>
                    <p className="font-medium">{formatDate(loan.loanDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-green-500'}`} />
                  <div>
                    <p className="text-gray-500">Fecha de vencimiento</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {formatDate(loan.dueDate)}
                    </p>
                  </div>
                </div>
                
                {isOverdue && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-gray-500">Días de retraso</p>
                      <p className="font-medium text-red-600">{daysOverdue} días</p>
                    </div>
                  </div>
                )}
              </div>
              
              {loan.observations && (
                <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">
                    <strong>Observaciones del préstamo:</strong> {loan.observations}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de Devolución */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Datos de Devolución</h4>
            
            {/* Fecha de Devolución */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Devolución *
              </label>
              <input
                type="date"
                value={returnData.returnDate}
                onChange={(e) => setReturnData(prev => ({ ...prev, returnDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.returnDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.returnDate && (
                <p className="mt-1 text-sm text-red-600">{errors.returnDate}</p>
              )}
            </div>

            {/* Estado del Recurso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condición del Recurso *
              </label>
              <select
                value={returnData.resourceCondition}
                onChange={(e) => setReturnData(prev => ({ ...prev, resourceCondition: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.resourceCondition ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="good">Bueno - Sin daños</option>
                <option value="deteriorated">Deteriorado - Desgaste normal</option>
                <option value="damaged">Dañado - Requiere reparación</option>
                <option value="lost">Perdido - No devuelto</option>
              </select>
              {errors.resourceCondition && (
                <p className="mt-1 text-sm text-red-600">{errors.resourceCondition}</p>
              )}
              
              {/* Descripción de estados */}
              <div className="mt-2 text-xs text-gray-500">
                <p><strong>Bueno:</strong> El recurso se encuentra en perfecto estado</p>
                <p><strong>Deteriorado:</strong> Presenta desgaste por uso normal</p>
                <p><strong>Dañado:</strong> Presenta daños que afectan su funcionalidad</p>
                <p><strong>Perdido:</strong> El recurso no fue devuelto</p>
              </div>
            </div>

            {/* Observaciones de Devolución */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Observaciones de Devolución
              </label>
              <textarea
                rows={4}
                value={returnData.returnObservations}
                onChange={(e) => setReturnData(prev => ({ ...prev, returnObservations: e.target.value }))}
                placeholder={`Observaciones sobre la devolución${isOverdue ? ', motivo del retraso' : ''}...`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.returnObservations ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.returnObservations && (
                <p className="mt-1 text-sm text-red-600">{errors.returnObservations}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {500 - (returnData.returnObservations?.length || 0)} caracteres restantes
              </p>
            </div>

            {/* Aviso de multa (si está vencido) */}
            {isOverdue && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Préstamo Vencido</p>
                    <p className="text-yellow-700 mt-1">
                      Este préstamo tiene {daysOverdue} días de retraso. 
                      Según las políticas de la biblioteca, podrían aplicarse sanciones.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con Botones */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
          <div>
            {/* Botón Marcar como Perdido (solo si está muy vencido) */}
            {daysOverdue >= 30 && (
              <button
                onClick={handleMarkAsLost}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Marcar como Perdido
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleReturn}
              disabled={processing || returnData.resourceCondition === 'lost'}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {processing && <RefreshCw className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              <span>
                {processing ? 'Procesando...' : 'Procesar Devolución'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;