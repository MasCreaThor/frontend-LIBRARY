// src/components/loans/LoanManagement.tsx
import React, { useState } from 'react';
import { 
  Book, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';

// Importar componentes hijos
import LoansList from './LoansList';
import ReturnsManagement from './ReturnsManagement';
import OverdueManagement from './OverdueManagement';
import LoanStatistics from './LoanStatistics';
import CreateLoanModal from './CreateLoanModal';

/**
 * Componente principal de gestión de préstamos
 * Ubicación: src/components/loan/LoanManagement.tsx
 */
const LoanManagement = () => {
  const [activeTab, setActiveTab] = useState('loans');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const tabs = [
    { id: 'loans', label: 'Préstamos', icon: Book },
    { id: 'returns', label: 'Devoluciones', icon: RefreshCw },
    { id: 'overdue', label: 'Vencidos', icon: AlertTriangle },
    { id: 'stats', label: 'Estadísticas', icon: FileText }
  ];

  const handleLoanCreated = () => {
    setShowCreateForm(false);
    // Podrías disparar un evento o callback para refrescar la lista
    window.location.reload(); // Temporal - mejor usar estado/context
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Book className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Préstamos
              </h1>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Préstamo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'loans' && <LoansList />}
        {activeTab === 'returns' && <ReturnsManagement />}
        {activeTab === 'overdue' && <OverdueManagement />}
        {activeTab === 'stats' && <LoanStatistics />}
      </div>

      {/* Modal de Crear Préstamo */}
      {showCreateForm && (
        <CreateLoanModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleLoanCreated}
        />
      )}
    </div>
  );
};

export default LoanManagement;