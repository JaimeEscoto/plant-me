import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import JardinView from './components/JardinView';
import HistorialView from './components/HistorialView';

const Dashboard = () => {
  const { garden, fetchGarden, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('jardin');

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-b from-gardenSky to-white">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-gardenGreen">Mi Jardín Mental</h1>
        <nav className="space-x-3">
          <button
            className={`px-4 py-2 rounded-full transition ${
              activeTab === 'jardin'
                ? 'bg-gardenGreen text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('jardin')}
          >
            Jardín
          </button>
          <button
            className={`px-4 py-2 rounded-full transition ${
              activeTab === 'historial'
                ? 'bg-gardenGreen text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
          <button
            className="px-4 py-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </nav>
      </header>
      <main className="p-6">
        {activeTab === 'jardin' ? <JardinView /> : <HistorialView />}
      </main>
    </div>
  );
};

const App = () => {
  const { token } = useAuth();
  return token ? <Dashboard /> : <Auth />;
};

const AppWithProvider = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithProvider;
