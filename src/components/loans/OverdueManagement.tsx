// src/components/loans/OverdueManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  User,
  Filter,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Importar hooks y tipos
import { useOverdue, useStatistics } from '@/hooks/useLoans';
import type { OverdueFilters, LoanWithDetails } from '@/types/loan.types';

/**
 * Componente de gestión de préstamos vencidos
 * Ubicación: src/components/loan/OverdueManagement.tsx
 */
const OverdueManagement = () => {
  const [localFilters, setLocalFilters] = useState<Partial<OverdueFilters>>({
    search: '',
    personType: '',
    minDaysOverdue: '',
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });

  // Hook para préstamos vencidos
  const {
    overdueLoans,
    stats: overdueStats,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    refetch,
    refetchStats
  } = useOverdue();

  // Hook para estadísticas generales (para obtener datos adicionales)
  const { overdueStats: generalOverdueStats } = useStatistics();

  // Aplicar filtros con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters(localFilters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localFilters, updateFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue >= 30) return 'bg-red-100 text-red-800 border-red-200';
    if (daysOverdue >= 15) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysOverdue >= 8) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  const handleContactPerson = (loan: LoanWithDetails) => {
    // Aquí podrías integrar con sistema de notificaciones
    console.log('Contactar persona:', loan.person?.fullName);
    alert(`Función de contacto para ${loan.person?.fullName} - Implementar según necesidades`);
  };

  // Estadísticas por defecto si no hay datos
  const stats = overdueStats || generalOverdueStats || {
    totalOverdue: overdueLoans.length,
    averageDaysOverdue: overdueLoans.length > 0 
      ? overdueLoans.reduce((acc, loan) => acc + (loan.daysOverdue || 0), 0) / overdueLoans.length 
      : 0,
    byPersonType: {
      students: overdueLoans.filter(loan => loan.person?.personType?.name === 'student').length,
      teachers: overdueLoans.filter(loan => loan.person?.personType?.name === 'teacher').length
    },
    byDaysOverdue: {
      '1-7': overdueLoans.filter(loan => (loan.daysOverdue || 0) >= 1 && (loan.daysOverdue || 0) <= 7).length,
      '8-14': overdueLoans.filter(loan => (loan.daysOverdue || 0) >= 8 && (loan.daysOverdue || 0) <= 14).length,
      '15-30': overdueLoans.filter(loan => (loan.daysOverdue || 0) >= 15 && (loan.daysOverdue || 0) <= 30).length,
      '30+': overdueLoans.filter(loan => (loan.daysOverdue || 0) > 30).length
    },
    mostOverdueResources: []
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas de Vencidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Vencidos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOverdue}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">+5% esta semana</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Promedio Días</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.averageDaysOverdue.toFixed(1)}
              </p>
              <div className="flex items-center mt-1">
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-2.1 días</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Estudiantes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.byPersonType.students}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOverdue > 0 ? Math.round((stats.byPersonType.students / stats.totalOverdue) * 100) : 0}% del total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Profesores</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.byPersonType.teachers}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOverdue > 0 ? Math.round((stats.byPersonType.teachers / stats.totalOverdue) * 100) : 0}% del total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Días de Retraso */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Distribución por Días de Retraso
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.byDaysOverdue['1-7']}
            </p>
            <p className="text-sm text-gray-600">1-7 días</p>
            <p className="text-xs text-yellow-700 mt-1">Acción temprana</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-2xl font-bold text-orange-600">
              {stats.byDaysOverdue['8-14']}
            </p>
            <p className="text-sm text-gray-600">8-14 días</p>
            <p className="text-xs text-orange-700 mt-1">Seguimiento activo</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-600">
              {stats.byDaysOverdue['15-30']}
            </p>
            <p className="text-sm text-gray-600">15-30 días</p>
            <p className="text-xs text-red-700 mt-1">Acción urgente</p>
          </div>
          <div className="text-center p-4 bg-red-100 rounded-lg border border-red-300">
            <p className="text-2xl font-bold text-red-700">
              {stats.byDaysOverdue['30+']}
            </p>
            <p className="text-sm text-gray-600">Más de 30 días</p>
            <p className="text-xs text-red-800 mt-1">Crítico</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar préstamos vencidos..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <select
            value={localFilters.personType || ''}
            onChange={(e) => handleFilterChange('personType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="student">Estudiantes</option>
            <option value="teacher">Profesores</option>
          </select>

          <input
            type="number"
            placeholder="Días mínimos"
            value={localFilters.minDaysOverdue || ''}
            onChange={(e) => handleFilterChange('minDaysOverdue', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex space-x-2">
            <select
              value={`${localFilters.sortBy || 'dueDate'}-${localFilters.sortOrder || 'asc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="dueDate-asc">Vencimiento (más antiguo)</option>
              <option value="dueDate-desc">Vencimiento (más reciente)</option>
              <option value="daysOverdue-desc">Más días de retraso</option>
              <option value="daysOverdue-asc">Menos días de retraso</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Préstamos Vencidos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Préstamos Vencidos ({overdueLoans.length})
            </h3>
            
            {loading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Actualizando...</span>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar préstamos vencidos
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        ) : overdueLoans.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¡Excelente! No hay préstamos vencidos
            </h3>
            <p className="text-gray-600">
              {localFilters.search || localFilters.personType || localFilters.minDaysOverdue ? 
                'No se encontraron préstamos vencidos con los filtros aplicados' : 
                'Todos los préstamos están al día'
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
                    Retraso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-gray-50">
                    {/* Información del Préstamo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {loan.person?.fullName || 'Persona no disponible'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {loan.person?.documentNumber && `${loan.person.documentNumber} • `}
                            {loan.person?.grade || 'Sin grado'}
                            {loan.person?.personType && (
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                loan.person.personType.name === 'student' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {loan.person.personType.name === 'student' ? 'Estudiante' : 'Profesor'}
                              </span>
                            )}
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
                          <Clock className="h-4 w-4 mr-1 text-red-500" />
                          <span className="text-red-600 font-medium">
                            Venció: {formatDate(loan.dueDate)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Información de Retraso */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <div className="text-lg font-bold text-red-600">
                            {loan.daysOverdue || 0}
                          </div>
                          <div className="text-xs text-gray-500">
                            día{(loan.daysOverdue || 0) !== 1 ? 's' : ''} de retraso
                          </div>
                          <div className={`mt-1 px-2 py-1 text-xs rounded-full border ${
                            getSeverityColor(loan.daysOverdue || 0)
                          }`}>
                            {(loan.daysOverdue || 0) >= 30 ? 'Crítico' :
                             (loan.daysOverdue || 0) >= 15 ? 'Urgente' :
                             (loan.daysOverdue || 0) >= 8 ? 'Moderado' : 'Leve'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleContactPerson(loan)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          title="Contactar persona"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            // Aquí podrías abrir el modal de devolución
                            console.log('Procesar devolución:', loan._id);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Devolver
                        </button>
                        
                        {(loan.daysOverdue || 0) >= 30 && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Marcar el recurso "${loan.resource?.title}" como perdido?`)) {
                                console.log('Marcar como perdido:', loan._id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Marcar Perdido
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                <span className="font-medium">{pagination.total}</span> préstamos vencidos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueManagement;