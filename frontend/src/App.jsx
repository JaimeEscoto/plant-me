import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Auth from './components/Auth';
import JardinView from './components/JardinView';
import ShopView from './components/ShopView';
import HistorialView from './components/HistorialView';
import ComunidadView from './components/ComunidadView';
import LanguageSelector from './components/LanguageSelector';
import AdminArea from './components/AdminArea';

const Dashboard = () => {
  const { garden, fetchGarden, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('jardin');
  const { t } = useLanguage();

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-b from-gardenSky to-white">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-gardenGreen">{t('headerTitle')}</h1>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <LanguageSelector />
          <nav className="space-x-3">
            <button
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'jardin'
                  ? 'bg-gardenGreen text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('jardin')}
            >
              {t('navGarden')}
            </button>
            <button
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'shop'
                  ? 'bg-gardenGreen text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('shop')}
            >
              {t('navShop')}
            </button>
            <button
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'historial'
                  ? 'bg-gardenGreen text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('historial')}
            >
              {t('navHistory')}
            </button>
            <button
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'comunidad'
                  ? 'bg-gardenGreen text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('comunidad')}
            >
              {t('navCommunity')}
            </button>
            <button
              className="px-4 py-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              onClick={logout}
            >
              {t('navLogout')}
            </button>
          </nav>
        </div>
      </header>
      <main className="p-6">
        {activeTab === 'jardin' && <JardinView />}
        {activeTab === 'shop' && <ShopView />}
        {activeTab === 'historial' && <HistorialView />}
        {activeTab === 'comunidad' && <ComunidadView />}
      </main>
    </div>
  );
};

const App = () => {
  const { token, user } = useAuth();

  if (!token) {
    return <Auth />;
  }

  if (user?.rol === 'admin') {
    return <AdminArea />;
  }

  return <Dashboard />;
};

const AppWithProvider = () => (
  <LanguageProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LanguageProvider>
);

export default AppWithProvider;
