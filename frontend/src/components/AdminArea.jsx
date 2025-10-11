import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import AdminDashboard from './AdminDashboard';
import AdminUserManagement from './AdminUserManagement';
import AdminSettings from './AdminSettings';

const AdminArea = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700">{t('headerTitle')}</h1>
          <p className="text-xs text-slate-500">
            {user?.nombre_usuario ? `@${user.nombre_usuario}` : t('adminRoleAdmin')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <LanguageSelector />
          <nav className="space-x-3">
            <button
              type="button"
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              {t('adminNavDashboard')}
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'monedas'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('monedas')}
            >
              {t('adminNavCoins')}
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-full transition ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              {t('adminNavSettings')}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              onClick={logout}
            >
              {t('navLogout')}
            </button>
          </nav>
        </div>
      </header>
      <main className="p-6">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'monedas' && <AdminUserManagement />}
        {activeTab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
};

export default AdminArea;
