import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

const initialForm = {
  nombre_usuario: '',
  email: '',
  contrasena: '',
};

const Auth = () => {
  const { login, register, loading, error } = useAuth();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isLogin) {
        await login({ email: form.email, contrasena: form.contrasena });
      } else {
        await register(form);
      }
    } catch (err) {
      // Error handled in context
    }
  };

  const fillDemoCredentials = () => {
    setIsLogin(true);
    setForm({ ...initialForm, email: 'test@example.com', contrasena: 'test1234' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gardenSky to-gardenGreen/40">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-4 flex justify-end">
          <LanguageSelector variant="auth" />
        </div>
        <h2 className="mb-6 text-center text-3xl font-bold text-gardenGreen">
          {isLogin ? t('authWelcomeTitle') : t('authCreateAccountTitle')}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-600">{t('authIntro')}</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="nombre_usuario">
                {t('authUsernameLabel')}
              </label>
              <input
                id="nombre_usuario"
                name="nombre_usuario"
                type="text"
                value={form.nombre_usuario}
                onChange={handleChange}
                className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="email">
              {t('authEmailLabel')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="contrasena">
              {t('authPasswordLabel')}
            </label>
            <input
              id="contrasena"
              name="contrasena"
              type="password"
              value={form.contrasena}
              onChange={handleChange}
              className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-gardenGreen py-2 font-semibold text-white transition hover:bg-emerald-600"
            disabled={loading}
          >
            {loading ? t('authProcessing') : isLogin ? t('authLoginButton') : t('authRegisterButton')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? t('authNoAccount') : t('authHaveAccount')}{' '}
          <button
            type="button"
            className="font-semibold text-gardenGreen hover:underline"
            onClick={() => {
              setIsLogin((prev) => !prev);
              setForm(initialForm);
            }}
          >
            {isLogin ? t('authRegisterLink') : t('authLoginLink')}
          </button>
        </p>
        {isLogin && (
          <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-gardenGreen">{t('authDemoTitle')}</p>
            <p className="mt-1">
              {t('authDemoText', { email: 'test@example.com', password: 'test1234' })}
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-gardenGreen px-4 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              {t('authDemoButton')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
