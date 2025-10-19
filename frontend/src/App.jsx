import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { EventTypeProvider } from './context/EventTypeContext';
import { EventCategoryProvider } from './context/EventCategoryContext';
import Auth from './components/Auth';
import JardinView from './components/JardinView';
import ShopView from './components/ShopView';
import SeedHistoryView from './components/SeedHistoryView';
import HistorialView from './components/HistorialView';
import ComunidadView from './components/ComunidadView';
import LanguageSelector from './components/LanguageSelector';
import ProfilePhotoManager from './components/ProfilePhotoManager';
import AdminArea from './components/AdminArea';

const Dashboard = () => {
  const { garden, fetchGarden, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('jardin');
  const [isClassicLayout, setIsClassicLayout] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderContent = () => {
    switch (activeTab) {
      case 'shop':
        return <ShopView />;
      case 'seed-history':
        return <SeedHistoryView />;
      case 'historial':
        return <HistorialView />;
      case 'comunidad':
        return <ComunidadView />;
      case 'jardin':
      default:
        return <JardinView />;
    }
  };

  const renderClassicLayout = () => (
    <div className="min-h-screen bg-gradient-to-b from-gardenSky to-white">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-gardenGreen">{t('headerTitle')}</h1>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ProfilePhotoManager />
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
                activeTab === 'seed-history'
                  ? 'bg-gardenGreen text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('seed-history')}
            >
              {t('navSeedHistory')}
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
      <main className="p-6 space-y-6">
        <div className="flex justify-end">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded-full hover:bg-slate-300"
            onClick={() => setIsClassicLayout(false)}
          >
            Volver al diseño renovado
          </button>
        </div>
        {renderContent()}
      </main>
    </div>
  );

  if (isClassicLayout) {
    return renderClassicLayout();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col bg-white border-r border-slate-200 shadow-sm">
          <div className="px-6 py-6 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">PlantMe</p>
                <h1 className="text-xl font-semibold text-gardenGreen">{t('headerTitle')}</h1>
              </div>
              <span className="inline-flex items-center justify-center w-10 h-10 text-lg font-semibold text-white bg-gardenGreen rounded-full">
                🌱
              </span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            <div>
              <p className="px-2 mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Explorar</p>
              <div className="space-y-1">
                <button
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gardenGreen/40 ${
                    activeTab === 'jardin'
                      ? 'bg-gardenGreen/10 text-gardenGreen shadow-inner'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveTab('jardin')}
                >
                  {t('navGarden')}
                </button>
                <button
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gardenGreen/40 ${
                    activeTab === 'shop'
                      ? 'bg-gardenGreen/10 text-gardenGreen shadow-inner'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveTab('shop')}
                >
                  {t('navShop')}
                </button>
              </div>
            </div>
            <div>
              <p className="px-2 mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Seguimiento</p>
              <div className="space-y-1">
                <button
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gardenGreen/40 ${
                    activeTab === 'seed-history'
                      ? 'bg-gardenGreen/10 text-gardenGreen shadow-inner'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveTab('seed-history')}
                >
                  {t('navSeedHistory')}
                </button>
                <button
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gardenGreen/40 ${
                    activeTab === 'historial'
                      ? 'bg-gardenGreen/10 text-gardenGreen shadow-inner'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveTab('historial')}
                >
                  {t('navHistory')}
                </button>
              </div>
            </div>
            <div>
              <p className="px-2 mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Comunidad</p>
              <div className="space-y-1">
                <button
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gardenGreen/40 ${
                    activeTab === 'comunidad'
                      ? 'bg-gardenGreen/10 text-gardenGreen shadow-inner'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setActiveTab('comunidad')}
                >
                  {t('navCommunity')}
                </button>
              </div>
            </div>
          </nav>
          <div className="px-6 py-6 space-y-3 border-t border-slate-100">
            <button
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              onClick={() => setIsClassicLayout(true)}
            >
              Volver a la vista clásica
            </button>
            <button
              className="w-full px-4 py-2 text-sm font-semibold text-red-500 bg-red-100 rounded-lg hover:bg-red-200"
              onClick={logout}
            >
              {t('navLogout')}
            </button>
          </div>
        </aside>
        <main className="flex flex-col pr-6">
          <div className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur border-b border-slate-200">
            <div className="flex flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Bienvenido a tu jardín inteligente</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Gestiona tus cultivos, descubre nuevas semillas y conecta con la comunidad en un solo lugar.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSelector />
                <ProfilePhotoManager />
              </div>
            </div>
          </div>
          <div className="flex-1 px-6 pb-10 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
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
      <EventTypeProvider>
        <EventCategoryProvider>
          <App />
        </EventCategoryProvider>
      </EventTypeProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default AppWithProvider;
