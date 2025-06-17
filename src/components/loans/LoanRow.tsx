// src/components/loans/LoanRow.tsx
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  RotateCcw,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

// Importar tipos
import type { LoanWithDetails } from '@/types/loan.types';

// Importar servicios y hooks
import { LoanService } from '@/services/loan.service';
import { useReturn } from '@/hooks/useLoans';

interface LoanRowProps {
  loan: LoanWithDetails;
  onUpdate?: () => void;
}

/**
 * Componente de fila individual de préstamo
 * Ubicación: src/components/loan/LoanRow.tsx
 */
const LoanRow: React.FC<LoanRowProps> = ({ loan, onUpdate }) => {
  const [showActions, setShowActions] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { processReturn } = useReturn();

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusInfo = (loan: LoanWithDetails) => {
    if (loan.status?.name === 'returned') {
      return {
        icon: CheckCircle,
        label: 'Devuelto',
        color: '#10b981',
        bgColor: '#10b98120'
      };
    }
    
    if (loan.isOverdue) {
      return {
        icon: AlertTriangle,
        label: 'Vencido',
        color: '#ef4444',
        bgColor: '#ef444420'
      };
    }
    
    if (loan.status?.name === 'lost') {
      return {
        icon: XCircle,
        label: 'Perdido',
        color: '#6b7280',
        bgColor: '#6b728020'
      };
    }
    
    return {
      icon: CheckCircle,
      label: 'Activo',
      color: '#10b981',
      bgColor: '#10b98120'
    };
  };

  const handleQuickReturn = async () => {
    if (!confirm('¿Confirmas que quieres procesar esta devolución?')) {
      return;
    }

    setProcessing(true);
    try {
      await processReturn({
        loanId: loan._id,
        returnDate: new Date().toISOString(),
        resourceCondition: 'good',
        returnObservations: 'Devolución rápida desde la lista'
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error en devolución rápida:', error);
      alert('Error al procesar la devolución');
    } finally {
      setProcessing(false);
    }
  };

  const handleRenewLoan = async () => {
    if (!confirm('¿Quieres renovar este préstamo por 15 días más?')) {
      return;
    }

    setProcessing(true);
    try {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 15);
      
      await LoanService.renewLoan(loan._id, newDueDate.toISOString());
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error al renovar préstamo:', error);
      alert('Error al renovar el préstamo');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = () => {
    // Aquí podrías abrir un modal de detalles o navegar a otra página
    console.log('Ver detalles del préstamo:', loan._id);
  };

  const statusInfo = getStatusInfo(loan);
  const StatusIcon = statusInfo.icon;
  const isActive = loan.status?.name === 'active';
  const canReturn = isActive && !processing;
  const canRenew = isActive && !loan.isOverdue && !processing;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Información de Persona */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {loan.person?.fullName || 'Persona no disponible'}
            </div>
            <div className="text-sm text-gray-500">
              {loan.person?.documentNumber && `${loan.person.documentNumber} • `}
              {loan.person?.grade || 'Sin grado'}
            </div>
            {loan.person?.personType && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mt-1">
                {loan.person.personType.name === 'student' ? 'Estudiante' : 'Profesor'}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Información de Recurso */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 font-medium line-clamp-2">
          {loan.resource?.title || 'Recurso no disponible'}
        </div>
        <div className="text-sm text-gray-500">
          {loan.resource?.author && `${loan.resource.author} • `}
          {loan.resource?.isbn && `ISBN: ${loan.resource.isbn}`}
        </div>
        {loan.resource?.totalQuantity !== undefined && (
          <div className="text-xs text-gray-400 mt-1">
            Stock: {loan.resource.availableQuantity || 0}/{loan.resource.totalQuantity}
            {loan.resource.currentLoansCount !== undefined && 
              ` (${loan.resource.currentLoansCount} prestados)`
            }
          </div>
        )}
      </td>

      {/* Cantidad */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-medium">
          {loan.quantity} unidad{loan.quantity > 1 ? 'es' : ''}
        </div>
      </td>

      {/* Fechas */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="space-y-1">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Prestado: {formatDate(loan.loanDate)}</span>
          </div>
          <div className="flex items-center">
            <Clock className={`h-4 w-4 mr-1 ${loan.isOverdue ? 'text-red-500' : ''}`} />
            <span className={loan.isOverdue ? 'text-red-600' : ''}>
              Vence: {formatDate(loan.dueDate)}
            </span>
          </div>
          {loan.isOverdue && loan.daysOverdue && (
            <div className="text-red-600 font-medium text-xs">
              {loan.daysOverdue} días de retraso
            </div>
          )}
          {loan.returnedDate && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Devuelto: {formatDate(loan.returnedDate)}</span>
            </div>
          )}
        </div>
      </td>

      {/* Estado */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: statusInfo.bgColor,
            color: statusInfo.color
          }}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusInfo.label}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {/* Botón Ver Detalles */}
          <button
            onClick={handleViewDetails}
            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-md hover:bg-blue-50"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Acciones para préstamos activos */}
          {isActive && (
            <>
              {/* Botón Devolución Rápida */}
              {canReturn && (
                <button
                  onClick={handleQuickReturn}
                  disabled={processing}
                  className="text-green-600 hover:text-green-900 transition-colors p-1 rounded-md hover:bg-green-50 disabled:opacity-50"
                  title="Devolución rápida"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Botón Renovar */}
              {canRenew && (
                <button
                  onClick={handleRenewLoan}
                  disabled={processing}
                  className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 rounded-md hover:bg-yellow-50 disabled:opacity-50"
                  title="Renovar préstamo"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </>
          )}

          {/* Menú de más acciones */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleViewDetails();
                      setShowActions(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Ver detalles completos
                  </button>
                  
                  {isActive && (
                    <>
                      <button
                        onClick={() => {
                          // Abrir modal de devolución completa
                          setShowActions(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Devolución con detalles
                      </button>
                      
                      <button
                        onClick={() => {
                          // Editar préstamo
                          setShowActions(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Editar préstamo
                      </button>
                      
                      {loan.isOverdue && (
                        <button
                          onClick={() => {
                            // Marcar como perdido
                            setShowActions(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          Marcar como perdido
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default LoanRow;