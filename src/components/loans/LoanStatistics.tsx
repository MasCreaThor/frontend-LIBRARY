// src/components/loans/LoanStatistics.tsx
import React, { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Book,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';

// Importar hooks
import { useStatistics, useDashboard } from '@/hooks/useLoans';

/**
 * Componente de dashboard de estadísticas de préstamos
 * Ubicación: src/components/loan/LoanStatistics.tsx
 */
const LoanStatistics = () => {
  const {
    loanStats,
    stockStats,
    overdueStats,
    loading,
    error,
    fetchAllStats
  } = useStatistics();

  const {
    summary,
    dueSoonLoans,
    refetch: refetchDashboard
  } = useDashboard();

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const handleRefresh = () => {
    fetchAllStats();
    refetchDashboard();
  };

  // Mock data para desarrollo
  const mockLoanStats = {
    totalLoans: 1247,
    activeLoans: 89,
    returnedLoans: 1098,
    overdueLoans: 15,
    lostLoans: 3,
    averageLoanDuration: 12.5,
    topBorrowedResources: [
      { title: 'Matemáticas Básicas', count: 45 },
      { title: 'Historia Universal', count: 38 },
      { title: 'Ciencias Naturales', count: 32 },
      { title: 'Literatura Española', count: 28 },
      { title: 'Geografía Mundial', count: 24 }
    ],
    topBorrowers: [
      { fullName: 'Juan Pérez', count: 12 },
      { fullName: 'María González', count: 10 },
      { fullName: 'Carlos Rodríguez', count: 9 },
      { fullName: 'Ana Martínez', count: 8 },
      { fullName: 'Luis Torres', count: 7 }
    ]
  };

  const mockStockStats = {
    totalResources: 156,
    resourcesWithStock: 142,
    resourcesWithoutStock: 14,
    totalUnits: 2843,
    loanedUnits: 298,
    availableUnits: 2545,
    topLoanedResources: [
      { title: 'Matemáticas Básicas', currentLoans: 15, totalQuantity: 25 },
      { title: 'Historia Universal', currentLoans: 12, totalQuantity: 20 },
      { title: 'Ciencias Naturales', currentLoans: 8, totalQuantity: 18 }
    ],
    lowStockResources: [
      { title: 'Atlas Mundial', availableQuantity: 1, totalQuantity: 5 },
      { title: 'Diccionario Inglés', availableQuantity: 0, totalQuantity: 8 },
      { title: 'Manual de Química', availableQuantity: 2, totalQuantity: 12 }
    ]
  };

  const mockOverdueStats = {
    totalOverdue: 15,
    averageDaysOverdue: 8.5,
    byPersonType: { students: 12, teachers: 3 },
    byDaysOverdue: {
      '1-7': 5,
      '8-14': 7,
      '15-30': 2,
      '30+': 1
    }
  };

  // Datos para gráficos
  const statusData = [
    { name: 'Activos', value: mockLoanStats.activeLoans, color: '#10b981' },
    { name: 'Devueltos', value: mockLoanStats.returnedLoans, color: '#6b7280' },
    { name: 'Vencidos', value: mockLoanStats.overdueLoans, color: '#ef4444' },
    { name: 'Perdidos', value: mockLoanStats.lostLoans, color: '#f59e0b' }
  ];

  const monthlyData = [
    { month: 'Ene', prestamos: 65, devoluciones: 72 },
    { month: 'Feb', prestamos: 78, devoluciones: 65 },
    { month: 'Mar', prestamos: 92, devoluciones: 88 },
    { month: 'Abr', prestamos: 85, devoluciones: 90 },
    { month: 'May', prestamos: 89, devoluciones: 85 },
    { month: 'Jun', prestamos: 94, devoluciones: 89 }
  ];

  const overdueDistribution = [
    { range: '1-7 días', count: mockOverdueStats.byDaysOverdue['1-7'] },
    { range: '8-14 días', count: mockOverdueStats.byDaysOverdue['8-14'] },
    { range: '15-30 días', count: mockOverdueStats.byDaysOverdue['15-30'] },
    { range: '+30 días', count: mockOverdueStats.byDaysOverdue['30+'] }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar estadísticas
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de refrescar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard de Estadísticas
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Préstamos"
          value={mockLoanStats.totalLoans}
          icon={Book}
          color="blue"
          trend={+12}
        />
        <MetricCard
          title="Préstamos Activos"
          value={mockLoanStats.activeLoans}
          icon={CheckCircle}
          color="green"
          trend={-3}
        />
        <MetricCard
          title="Préstamos Vencidos"
          value={mockLoanStats.overdueLoans}
          icon={AlertTriangle}
          color="red"
          trend={+5}
        />
        <MetricCard
          title="Promedio Días"
          value={mockLoanStats.averageLoanDuration}
          icon={Clock}
          color="purple"
          trend={-1.2}
          suffix=" días"
        />
      </div>

      {/* Métricas de stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Stock General</h3>
            <Book className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total recursos:</span>
              <span className="font-medium">{mockStockStats.totalResources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Con stock:</span>
              <span className="font-medium text-green-600">{mockStockStats.resourcesWithStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sin stock:</span>
              <span className="font-medium text-red-600">{mockStockStats.resourcesWithoutStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Unidades totales:</span>
              <span className="font-medium">{mockStockStats.totalUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Prestadas:</span>
              <span className="font-medium text-orange-600">{mockStockStats.loanedUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Disponibles:</span>
              <span className="font-medium text-green-600">{mockStockStats.availableUnits}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Recursos Prestados</h3>
          <div className="space-y-3">
            {mockStockStats.topLoanedResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {resource.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resource.currentLoans}/{resource.totalQuantity} prestados
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(resource.currentLoans / resource.totalQuantity) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Bajo</h3>
          <div className="space-y-3">
            {mockStockStats.lowStockResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {resource.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {resource.availableQuantity}/{resource.totalQuantity} disponibles
                  </p>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    resource.availableQuantity === 0
                      ? 'bg-red-100 text-red-800'
                      : resource.availableQuantity <= 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {resource.availableQuantity === 0 ? 'Agotado' : 'Bajo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por estado */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribución por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia mensual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tendencia Mensual
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="prestamos"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Préstamos"
              />
              <Line
                type="monotone"
                dataKey="devoluciones"
                stroke="#10b981"
                strokeWidth={2}
                name="Devoluciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de distribución de vencidos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Distribución de Préstamos Vencidos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={overdueDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recursos Más Prestados
          </h3>
          <div className="space-y-3">
            {mockLoanStats.topBorrowedResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {resource.title}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-600">
                  {resource.count} préstamos
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Usuarios Más Activos
          </h3>
          <div className="space-y-3">
            {mockLoanStats.topBorrowers.map((borrower, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {borrower.fullName}
                    </p>
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {borrower.count} préstamos
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de métrica
const MetricCard = ({ title, value, icon: Icon, color, trend, suffix = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {trend !== undefined && (
            <div className="flex items-center mt-1">
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default LoanStatistics;