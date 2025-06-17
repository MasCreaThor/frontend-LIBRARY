// src/components/loans/ReturnsManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  User, 
  Book, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';

// Importar hooks y tipos
import { useLoans, useDashboard } from '@/hooks/useLoans';
import type { LoanWithDetails, LoanSearchFilters } from '@/types/loan.types';
import ReturnModal from './ReturnModal';

/**
 * Componente de gestión de devoluciones
 * Ubicación: src/components/loan/ReturnsManagement.tsx
 */
const ReturnsManagement = () => {
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    personType: '',
    dueToday: false
  });

  // Hook para obtener préstamos activos
  const {
    loans: activeLoans,
    loading,
    error,
    pagination,
    updateFilters,
    refetch
  } = useLoans({
    status: 'active', // Solo préstamos activos
    limit: 20
  });

  // Hook para estadísticas del dashboard
  const { summary, refetch: refetchSummary } = useDashboard();

  // Aplicar filtros con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filters: LoanSearchFilters = {
        status: 'active',
        ...localFilters
      };

      // Filtro para préstamos que vencen hoy
      if (localFilters.dueToday) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filters.dateFrom = today;
        filters.dateTo = tomorrow;
      }

      updateFilters(filters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localFilters, updateFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReturnLoan = (loan: LoanWithDetails) => {
    setSelectedLoan(loan);
    setShowReturnModal(true);
  };

  const handleReturnSuccess = () => {
    setShowReturnModal(false);
    setSelectedLoan(null);
    refetch();
    refetchSummary();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getReturnPriority = (loan: LoanWithDetails) => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { priority: 'overdue', label: 'Vencido', color: 'red' };
    if (diffDays === 0) return { priority: 'today', label: 'Vence hoy', color: 'orange' };
    if (diffDays <= 3) return { priority: 'soon', label: 'Vence pronto', color: 'yellow' };
    return { priority: 'normal', label: 'Normal', color: 'green' };
  };

  // Estadísticas rápidas (mock data si no hay summary)
  const stats = summary || {
    totalActive: activeLoans.length || 0,
    totalOverdue: 0,
    totalDueSoon: 0,
    totalReturnsToday: 0
  };

  return (
    <div className="space-y-6">
      {/* Header con Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Book className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalActive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vencen Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDueSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vencidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOverdue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Devueltos Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReturnsToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar préstamos para devolver..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={localFilters.personType}
              onChange={(e) => handleFilterChange('personType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="student">Estudiantes</option>
              <option value="teacher">Profesores</option>
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localFilters.dueToday}
                onChange={(e) => handleFilterChange('dueToday', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Solo vencen hoy</span>
            </label>

            <button
              onClick={refetch}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Préstamos Activos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Préstamos Pendientes de Devolución
            </h3>
            
            {loading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando...</span>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar préstamos
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        ) : activeLoans.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay préstamos pendientes
            </h3>
            <p className="text-gray-600">
              {localFilters.search || localFilters.personType || localFilters.dueToday ? 
                'No se encontraron préstamos con los filtros aplicados' : 
                'Todos los préstamos han sido devueltos'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Préstamo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeLoans.map((loan) => {
                  const priority = getReturnPriority(loan);
                  
                  return (
                    <tr key={loan._id} className="hover:bg-gray-50">
                      {/* Información del Préstamo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {loan.person?.fullName || 'Persona no disponible'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {loan.person?.documentNumber && `${loan.person.documentNumber} • `}
                              {loan.person?.grade || 'Sin grado'}
                            </div>
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {loan.resource?.title || 'Recurso no disponible'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {loan.resource?.author && `${loan.resource.author} • `}
                              Cantidad: {loan.quantity}
                            </div>
                          </div>
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
                            <Clock className={`h-4 w-4 mr-1 ${
                              priority.priority === 'overdue' ? 'text-red-500' : 
                              priority.priority === 'today' ? 'text-orange-500' : ''
                            }`} />
                            <span className={
                              priority.priority === 'overdue' ? 'text-red-600' : 
                              priority.priority === 'today' ? 'text-orange-600' : ''
                            }>
                              Vence: {formatDate(loan.dueDate)}
                            </span>
                          </div>
                          {loan.isOverdue && loan.daysOverdue && (
                            <div className="text-red-600 font-medium text-xs">
                              {loan.daysOverdue} días de retraso
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Prioridad */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priority.color === 'red' ? 'bg-red-100 text-red-800' :
                          priority.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          priority.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {priority.priority === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {priority.priority === 'today' && <Clock className="h-3 w-3 mr-1" />}
                          {(priority.priority === 'soon' || priority.priority === 'normal') && <CheckCircle className="h-3 w-3 mr-1" />}
                          {priority.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleReturnLoan(loan)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ml-auto"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Devolver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => updateFilters({ ...localFilters, page: pagination.page - 1 })}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button 
              onClick={() => updateFilters({ ...localFilters, page: pagination.page + 1 })}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span> préstamos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Devolución */}
      {showReturnModal && selectedLoan && (
        <ReturnModal
          loan={selectedLoan}
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedLoan(null);
          }}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
};

export default ReturnsManagement;